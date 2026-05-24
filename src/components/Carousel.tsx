"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio, type PortfolioItem } from "@/data/portfolio";

const AUTOPLAY_MS = 5000;
// How long the scroll-reveal animation takes from top -> bottom of the screenshot.
const HOVER_REVEAL_S = 6;

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
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.querySelectorAll<HTMLLIElement>("li"));
    if (!cards.length) return;

    const center = track.scrollLeft + track.clientWidth / 2;
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
      setActiveIndex((current) => {
        const atEnd = current >= portfolio.length - 1;
        const atStart = current <= 0;
        const next =
          direction === 1
            ? atEnd
              ? 0
              : current + 1
            : atStart
              ? portfolio.length - 1
              : current - 1;

        const track = trackRef.current;
        const card = track?.querySelectorAll<HTMLLIElement>("li")[next];
        card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => syncActiveFromScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    syncActiveFromScroll();

    return () => track.removeEventListener("scroll", onScroll);
  }, [syncActiveFromScroll]);

  // Autoplay on page load — pause while hovering thumbnails, respect reduced motion.
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    if (paused) return;

    const id = window.setInterval(() => {
      scrollByCard(1);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [paused, scrollByCard]);

  return (
    <div className="relative pb-14 md:pb-20">
      <div className="mx-auto max-w-6xl px-5 pb-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate">
          Recent work &middot; hover any thumbnail to scroll through the page
        </p>
      </div>

      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] md:gap-5 md:px-8 [&::-webkit-scrollbar]:hidden"
        aria-label="Recent client websites"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {portfolio.map((p) => (
          <li
            key={p.slug}
            className="snap-start shrink-0 basis-[78%] sm:basis-[46%] md:basis-[32%] lg:basis-[26%]"
          >
            <PortfolioCard item={p} />
          </li>
        ))}
      </ul>

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
        Showing {portfolio[activeIndex]?.name ?? "project"} ({activeIndex + 1} of {portfolio.length})
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
