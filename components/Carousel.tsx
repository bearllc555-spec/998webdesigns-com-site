"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { portfolio } from "@/data/portfolio";

const AUTOPLAY_MS = 5000;
// How long the scroll-reveal animation takes from top -> bottom of the screenshot.
const HOVER_REVEAL_S = 6;

export function Carousel() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLLIElement>("li");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    const step = card.offsetWidth + gap;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  // Autoplay — pause on hover/focus, respect reduced motion.
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    if (paused) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [paused, scrollByCard]);

  return (
    <div
      className="relative pt-16 pb-14 md:pt-24 md:pb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5 pb-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate">
          <span className="text-accent">Recent work</span> &middot; hover any thumbnail to scroll through the page
        </p>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous"
            className="rounded-full border border-rule bg-bg p-2 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next"
            className="rounded-full border border-rule bg-bg p-2 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pl-0 pr-5 pb-4 md:gap-5 md:pr-8"
        style={{ scrollbarWidth: "thin" }}
        aria-label="Recent client websites"
      >
        {portfolio.map((p) => (
          <li
            key={p.slug}
            className="snap-start shrink-0 basis-[78%] sm:basis-[46%] md:basis-[32%] lg:basis-[26%]"
          >
            <Link
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-rule-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbnail}
                  alt={`${p.name} — ${p.industry}`}
                  loading="lazy"
                  decoding="async"
                  className="thumb-img absolute inset-0 h-full w-full object-cover"
                  style={{
                    objectPosition: "top center",
                    transition: `object-position ${HOVER_REVEAL_S}s linear`,
                  }}
                />
              </div>
              <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="truncate font-display text-base font-medium text-ink">
                  {p.name}
                </span>
                <span className="shrink-0 text-xs uppercase tracking-wider text-slate">
                  {p.industry}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Hover-reveal: on group-hover, slide object-position from top to bottom.
          Respects prefers-reduced-motion via the global rule in globals.css. */}
      <style>{`
        .group:hover .thumb-img { object-position: bottom center !important; }
        @media (prefers-reduced-motion: reduce) {
          .thumb-img { transition: none !important; }
          .group:hover .thumb-img { object-position: top center !important; }
        }
      `}</style>
    </div>
  );
}
