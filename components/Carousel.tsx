"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  hasPortfolioVideoPreviews,
  portfolio,
  type PortfolioItem,
} from "@/data/portfolio";

/** Duplicate slides so scrollLeft can loop without a visible jump. */
const LOOP_COPIES = 2;
const loopPortfolio = Array.from({ length: LOOP_COPIES }, () => portfolio).flat();

/** Pixels per second — slow continuous drift to the right. */
const SCROLL_SPEED_PX_S = 28;

// Pan duration for static JPEG fallbacks (no previewVideo).
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

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let raf = 0;
    let last = performance.now();
    let setWidth = track.scrollWidth / LOOP_COPIES;

    const remeasure = () => {
      setWidth = track.scrollWidth / LOOP_COPIES;
      if (setWidth > 0 && track.scrollLeft >= setWidth) {
        track.scrollLeft %= setWidth;
      }
    };

    const ro = new ResizeObserver(remeasure);
    ro.observe(track);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!paused && setWidth > 0) {
        track.scrollLeft += SCROLL_SPEED_PX_S * dt;
        if (track.scrollLeft >= setWidth) {
          track.scrollLeft -= setWidth;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [paused]);

  const hoverHint = hasPortfolioVideoPreviews
    ? "Hover any thumbnail to preview the site"
    : "Hover any thumbnail to scroll through the page";

  return (
    <div
      className="relative pt-16 pb-14 md:pt-24 md:pb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto max-w-6xl px-5 pb-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate">
          {hoverHint}
        </p>
      </div>

      <div className="relative overflow-hidden">
        <ul
          ref={trackRef}
          className="flex gap-4 overflow-x-hidden pl-0 pr-5 pb-14 md:gap-5 md:pr-8 md:pb-16 scrollbar-hide"
          style={{ scrollBehavior: "auto" }}
          aria-label="Recent client websites"
        >
          {loopPortfolio.map((p, index) => (
            <li
              key={`${p.slug}-${index}`}
              className="shrink-0 basis-[78%] sm:basis-[46%] md:basis-[32%] lg:basis-[26%]"
              aria-hidden={index >= portfolio.length ? true : undefined}
            >
              <PortfolioCard item={p} revealSeconds={HOVER_REVEAL_S} />
            </li>
          ))}
        </ul>

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
  revealSeconds,
}: {
  item: PortfolioItem;
  revealSeconds: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoActive, setVideoActive] = useState(false);

  const poster = item.previewPoster ?? item.thumbnail;
  const useVideo = Boolean(item.previewVideo) && !reduceMotion;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const startPreview = () => {
    if (!useVideo) return;
    const video = videoRef.current;
    if (!video) return;
    setVideoActive(true);
    video.currentTime = 0;
    void video.play().catch(() => setVideoActive(false));
  };

  const stopPreview = () => {
    if (!useVideo) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setVideoActive(false);
  };

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden bg-rule-soft"
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={`${item.name} — ${item.industry}`}
        loading="lazy"
        decoding="async"
        className={[
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          useVideo ? (videoActive ? "opacity-0" : "opacity-100") : "thumb-img--pan",
        ].join(" ")}
        style={
          useVideo
            ? { objectPosition: "top center" }
            : {
                objectPosition: "top center",
                transition: `object-position ${revealSeconds}s linear`,
              }
        }
      />
      {useVideo && item.previewVideo ? (
        <video
          ref={videoRef}
          src={item.previewVideo}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className={[
            "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300",
            videoActive ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-hidden
        />
      ) : null}
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
  revealSeconds,
}: {
  item: PortfolioItem;
  revealSeconds: number;
}) {
  const cardClass =
    "group block overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  const inner = (
    <>
      <PortfolioPreview item={item} revealSeconds={revealSeconds} />
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
