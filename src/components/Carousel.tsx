"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio, type PortfolioItem } from "@/data/portfolio";

const UNIQUE_COUNT = portfolio.length;
const MARQUEE_ITEMS = [...portfolio, ...portfolio];
// ~24px/sec at 60fps — slow continuous loop
const SCROLL_SPEED = 0.4;
const HOVER_REVEAL_S = 6;
const CARD_CLASS =
  "shrink-0 w-[min(78vw,360px)] sm:w-[min(46vw,360px)] md:w-[min(32vw,380px)] lg:w-[360px]";

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ThumbReveal({ item }: { item: PortfolioItem }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [shiftPx, setShiftPx] = useState(0);

  const measureShift = useCallback((img: HTMLImageElement) => {
    const container = viewportRef.current;
    if (!container) return;
    const delta = img.offsetHeight - container.offsetHeight;
    setShiftPx(delta > 0 ? delta : 0);
  }, []);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const img = container.querySelector("img");
    if (!img) return;

    if (img.complete) measureShift(img);

    const ro = new ResizeObserver(() => {
      if (img.complete) measureShift(img);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [measureShift, item.thumbnail]);

  return (
    <div
      ref={viewportRef}
      className="relative aspect-[4/3] w-full overflow-hidden bg-rule-soft"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnail}
        alt={`${item.name} — ${item.industry}`}
        loading="eager"
        decoding="async"
        onLoad={(e) => measureShift(e.currentTarget)}
        className="thumb-img absolute left-0 top-0 w-full max-w-none"
        style={{
          ["--thumb-shift" as string]: `${shiftPx}px`,
          transition: `transform ${HOVER_REVEAL_S}s linear`,
        }}
      />
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const inner = (
    <>
      <ThumbReveal item={item} />
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <span className="truncate font-display text-base font-medium text-ink">
          {item.name}
        </span>
        <span className="shrink-0 text-xs uppercase tracking-wider text-slate">
          {item.industry}
        </span>
      </div>
    </>
  );

  if (item.live) {
    return (
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className="group block cursor-default overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm"
      aria-label={`${item.name} preview — hover to scroll screenshot`}
    >
      {inner}
    </div>
  );
}

export function Carousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const posRef = useRef(0);
  const startPosRef = useRef(0);
  const wrapDeltaRef = useRef(0);
  const resumeAtRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const recalc = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const cards = track.querySelectorAll<HTMLLIElement>("li");
    if (cards.length < UNIQUE_COUNT * 2) return;

    startPosRef.current = cards[0].offsetLeft;
    wrapDeltaRef.current = cards[UNIQUE_COUNT].offsetLeft - cards[0].offsetLeft;
  }, []);

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const cards = Array.from(track.querySelectorAll<HTMLLIElement>("li")).slice(
      0,
      UNIQUE_COUNT
    );
    if (!cards.length) return;

    const center = posRef.current + viewport.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < minDist) {
        minDist = distance;
        closest = index;
      }
    });

    setActiveIndex(closest);
  }, []);

  const scrollByCard = useCallback(
    (direction: 1 | -1) => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const card = track.querySelector<HTMLLIElement>("li");
      if (!card) return;

      const gap = parseFloat(getComputedStyle(track).columnGap || "0");
      const step = card.offsetWidth + gap;

      posRef.current += step * direction;
      viewport.scrollTo({ left: Math.round(posRef.current), behavior: "smooth" });
      syncActiveIndex();
      resumeAtRef.current = Date.now() + 2000;
    },
    [syncActiveIndex]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;

    const init = () => {
      recalc();
      posRef.current = startPosRef.current;
      viewport.scrollLeft = Math.round(posRef.current);
      syncActiveIndex();
    };

    const tick = () => {
      const now = Date.now();
      if (
        !reducedMotionRef.current &&
        !paused &&
        now >= resumeAtRef.current &&
        wrapDeltaRef.current > 0
      ) {
        posRef.current += SCROLL_SPEED;
        if (posRef.current >= startPosRef.current + wrapDeltaRef.current) {
          posRef.current -= wrapDeltaRef.current;
        }
        viewport.scrollLeft = Math.round(posRef.current);
        syncActiveIndex();
      }
      raf = requestAnimationFrame(tick);
    };

    init();
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      recalc();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("load", init);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", init);
    };
  }, [paused, recalc, syncActiveIndex]);

  return (
    <div className="relative pb-14 md:pb-20">
      <div className="mx-auto max-w-6xl px-5 pb-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate">
          Recent work &middot; hover any thumbnail to scroll through the page
        </p>
      </div>

      <div
        ref={viewportRef}
        className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Recent client websites"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <ul ref={trackRef} className="flex w-max gap-4 px-5 md:gap-5 md:px-8">
          {MARQUEE_ITEMS.map((p, index) => (
            <li key={`${p.slug}-${index}`} className={CARD_CLASS}>
              <PortfolioCard item={p} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Previous project"
          className="rounded-full border border-rule bg-bg p-2.5 text-ink-soft transition hover:border-ink hover:text-ink"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Next project"
          className="rounded-full border border-rule bg-bg p-2.5 text-ink-soft transition hover:border-ink hover:text-ink"
        >
          <ChevronRight />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {portfolio[activeIndex]?.name ?? "project"} ({activeIndex + 1} of{" "}
        {portfolio.length})
      </p>

      <style>{`
        .group:hover .thumb-img { transform: translateY(calc(-1 * var(--thumb-shift, 0px))); }
        @media (prefers-reduced-motion: reduce) {
          .thumb-img { transition: none !important; }
          .group:hover .thumb-img { transform: none !important; }
        }
      `}</style>
    </div>
  );
}
