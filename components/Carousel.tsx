"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio, type PortfolioItem } from "@/data/portfolio";

const LOOP_COPIES = 2;
const loopPortfolio = Array.from({ length: LOOP_COPIES }, () => portfolio).flat();

/** Target drift speed — duration is derived from one copy width ÷ this. */
const MARQUEE_SPEED_PX_S = 28;

const CARD_WIDTH =
  "w-[78vw] shrink-0 sm:w-[46vw] md:w-[32vw] lg:w-[26vw] lg:max-w-[320px]";

const HOVER_PAN_S = 6;

function getTranslateX(el: HTMLElement): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  return new DOMMatrix(t).m41;
}

export function Carousel() {
  const trackRef = useRef<HTMLUListElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const manualXRef = useRef<number | null>(null);
  const thumbnailHoverCountRef = useRef(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const paused = hoverPaused || userPaused;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const syncMarqueeDuration = useCallback(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return;
    const setWidth = track.offsetWidth / LOOP_COPIES;
    if (setWidth <= 0) return;
    const seconds = setWidth / MARQUEE_SPEED_PX_S;
    track.style.setProperty("--marquee-duration", `${seconds}s`);
  }, [reduceMotion]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return;
    syncMarqueeDuration();
    const ro = new ResizeObserver(syncMarqueeDuration);
    ro.observe(track);
    return () => ro.disconnect();
  }, [reduceMotion, syncMarqueeDuration]);

  const resumeMarqueeAnimation = useCallback(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return;

    const setWidth = track.offsetWidth / LOOP_COPIES;
    if (setWidth <= 0) return;

    const x = manualXRef.current ?? getTranslateX(track);
    manualXRef.current = null;

    track.style.animation = "";
    track.style.transform = "";

    const progress = ((-x % setWidth) + setWidth) % setWidth / setWidth;
    const durationSec =
      parseFloat(getComputedStyle(track).getPropertyValue("--marquee-duration")) || 100;
    track.style.animationDelay = `${-progress * durationSec}s`;
  }, [reduceMotion]);

  const scrollByCard = useCallback(
    (direction: 1 | -1) => {
      if (reduceMotion) {
        const track = scrollRef.current;
        if (!track) return;
        const card = track.querySelector<HTMLLIElement>("li");
        if (!card) return;
        const gap = parseFloat(getComputedStyle(track).columnGap || "0");
        const step = card.offsetWidth + gap;
        track.scrollBy({ left: step * direction, behavior: "smooth" });
        return;
      }

      const track = trackRef.current;
      if (!track) return;
      const card = track.querySelector<HTMLLIElement>("li");
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).gap || "0");
      const step = card.offsetWidth + gap;
      const setWidth = track.offsetWidth / LOOP_COPIES;
      if (setWidth <= 0) return;

      let x = manualXRef.current ?? getTranslateX(track);
      x -= direction * step;

      while (x < -setWidth) x += setWidth;
      while (x > 0) x -= setWidth;

      manualXRef.current = x;
      track.style.animation = "none";
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      setUserPaused(true);
    },
    [reduceMotion]
  );

  const toggleUserPause = () => {
    setUserPaused((was) => {
      const next = !was;
      if (!next && manualXRef.current !== null) {
        queueMicrotask(() => resumeMarqueeAnimation());
      }
      return next;
    });
  };

  const handleThumbnailEnter = useCallback(() => {
    thumbnailHoverCountRef.current += 1;
    if (thumbnailHoverCountRef.current === 1) {
      setHoverPaused(true);
    }
  }, []);

  const handleThumbnailLeave = useCallback(() => {
    thumbnailHoverCountRef.current = Math.max(0, thumbnailHoverCountRef.current - 1);
    if (thumbnailHoverCountRef.current === 0) {
      setHoverPaused(false);
      if (!userPaused && manualXRef.current !== null) {
        resumeMarqueeAnimation();
      }
    }
  }, [userPaused, resumeMarqueeAnimation]);

  const cards = loopPortfolio.map((p, index) => (
    <li
      key={`${p.slug}-${index}`}
      className={CARD_WIDTH}
      aria-hidden={index >= portfolio.length ? true : undefined}
    >
      <PortfolioCard
        item={p}
        panSeconds={HOVER_PAN_S}
        onThumbnailEnter={handleThumbnailEnter}
        onThumbnailLeave={handleThumbnailLeave}
      />
    </li>
  ));

  return (
    <div className="relative pt-16 pb-14 md:pt-24 md:pb-20">
      <div className="mx-auto max-w-6xl px-5 pb-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate">
          Hover any thumbnail to scroll through the page
        </p>
      </div>

      <div
        className={`relative overflow-hidden ${!reduceMotion && paused ? "portfolio-marquee--paused" : ""}`}
      >
        {reduceMotion ? (
          <ul
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pl-0 pr-5 pb-14 md:gap-5 md:pr-8 md:pb-16 scrollbar-hide"
            aria-label="Recent client websites"
          >
            {portfolio.map((p) => (
              <li key={p.slug} className={CARD_WIDTH}>
                <PortfolioCard
                  item={p}
                  panSeconds={HOVER_PAN_S}
                  onThumbnailEnter={handleThumbnailEnter}
                  onThumbnailLeave={handleThumbnailLeave}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul
            ref={trackRef}
            className="portfolio-marquee-track list-none gap-4 pb-14 pl-0 md:gap-5 md:pb-16"
            aria-label="Recent client websites"
          >
            {cards}
          </ul>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2 md:pb-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-rule bg-bg/95 px-1.5 py-1 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous"
              className="rounded-full p-2 text-ink-soft transition hover:bg-rule-soft hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {!reduceMotion && (
              <button
                type="button"
                onClick={toggleUserPause}
                aria-label={userPaused ? "Resume carousel" : "Pause carousel"}
                aria-pressed={userPaused}
                className={`mx-0.5 h-3.5 w-6 shrink-0 rounded-full border transition-colors duration-200 ${
                  userPaused
                    ? "border-rule bg-rule-soft dark:border-zinc-500 dark:bg-zinc-600"
                    : "border-ink-soft/70 bg-transparent hover:border-ink-soft"
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next"
              className="rounded-full p-2 text-ink-soft transition hover:bg-rule-soft hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .group:hover .thumb-img--pan { object-position: bottom center !important; }
        @media (prefers-reduced-motion: reduce) {
          .thumb-img--pan { transition: none !important; }
          .group:hover .thumb-img--pan { object-position: top center !important; }
        }
      `}</style>
    </div>
  );
}

function PortfolioPreview({
  item,
  panSeconds,
  onThumbnailEnter,
  onThumbnailLeave,
}: {
  item: PortfolioItem;
  panSeconds: number;
  onThumbnailEnter?: () => void;
  onThumbnailLeave?: () => void;
}) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden bg-rule-soft"
      onMouseEnter={onThumbnailEnter}
      onMouseLeave={onThumbnailLeave}
      onFocus={onThumbnailEnter}
      onBlur={onThumbnailLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnail}
        alt={`${item.name} — ${item.industry}`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-top thumb-img--pan transition-opacity duration-300"
        style={{
          transition: `object-position ${panSeconds}s linear`,
        }}
      />
      {!item.url && (
        <span className="absolute bottom-3 left-3 z-10 rounded-full bg-bg/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-soft backdrop-blur">
          Preview coming soon
        </span>
      )}
    </div>
  );
}

function PortfolioCard({
  item,
  panSeconds,
  onThumbnailEnter,
  onThumbnailLeave,
}: {
  item: PortfolioItem;
  panSeconds: number;
  onThumbnailEnter?: () => void;
  onThumbnailLeave?: () => void;
}) {
  const cardClass =
    "group block overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  const inner = (
    <>
      <PortfolioPreview
        item={item}
        panSeconds={panSeconds}
        onThumbnailEnter={onThumbnailEnter}
        onThumbnailLeave={onThumbnailLeave}
      />
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

  if (item.url) {
    return (
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`${cardClass} cursor-default`} aria-label={`${item.name} preview`}>
      {inner}
    </div>
  );
}
