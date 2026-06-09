"use client";

import { useId } from "react";
import {
  JARVIS_AUDIO_IDLE,
  type JarvisAudioLevels,
} from "@/lib/voice-demo-jarvis-audio-level";

type PlumbingJarvisOrbProps = {
  levels: JarvisAudioLevels;
  speaking: boolean;
  connected: boolean;
  connecting: boolean;
};

/** Simplified sci-fi voice orb for plumbing demo — dark sphere on light card. */
export function PlumbingJarvisOrb({
  levels,
  speaking,
  connected,
  connecting,
}: PlumbingJarvisOrbProps) {
  const clipId = useId().replace(/:/g, "");
  const glowId = `plumbing-orb-glow-${clipId}`;
  const active = connected || connecting;
  const l = active ? levels : JARVIS_AUDIO_IDLE;

  const energy = active ? 0.28 + l.volume * 0.72 : 0.18;
  const flare = active ? 0.35 + l.treble * 0.65 : 0.12;
  const swirl = active ? 0.4 + l.mid * 0.55 : 0.22;
  const rim = active ? 0.45 + l.volume * 0.55 : 0.3;
  const halo = active ? 0.18 + l.volume * 0.35 : 0.1;
  const scale = 1 + (speaking ? l.volume * 0.06 + l.bass * 0.03 : 0);

  return (
    <div
      className={`relative flex h-28 w-28 items-center justify-center ${
        active && !speaking ? "animate-[plumbing-orb-breathe_3.4s_ease-in-out_infinite]" : ""
      }`}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0.45,
          boxShadow: `0 4px 28px rgba(37, 99, 235, ${halo}), 0 0 ${12 + energy * 20}px rgba(56, 189, 248, ${halo * 0.85})`,
        }}
      />

      <div
        className="absolute inset-1 overflow-hidden rounded-full transition-transform duration-150"
        style={{
          transform: `scale(${scale})`,
          background:
            "radial-gradient(circle at 42% 38%, #1e4a7a 0%, #0c1929 52%, #060d18 100%)",
          boxShadow: "inset 0 0 18px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div
          className={`absolute inset-0 ${active ? "animate-[plumbing-orb-swirl_22s_linear_infinite]" : ""}`}
          style={{
            opacity: swirl,
            animationDuration: speaking ? "14s" : "22s",
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            <defs>
              <clipPath id={clipId}>
                <circle cx="50" cy="50" r="49" />
              </clipPath>
              <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id={`${clipId}-ribbon`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                <stop offset="45%" stopColor="#7dd3fc" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <g clipPath={`url(#${clipId})`} filter={`url(#${glowId})`}>
              <path
                d="M 8 52 C 28 18, 72 18, 92 52 C 72 86, 28 86, 8 52 Z"
                fill="none"
                stroke={`url(#${clipId}-ribbon)`}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 14 38 Q 50 62 86 38"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.6"
                strokeOpacity="0.75"
                strokeLinecap="round"
              />
              <path
                d="M 18 64 Q 50 40 82 64"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.4"
                strokeOpacity="0.55"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <clipPath id={`${clipId}-eq`}>
              <circle cx="50" cy="50" r="49" />
            </clipPath>
            <linearGradient id={`${clipId}-equator`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="35%" stopColor="#7dd3fc" stopOpacity="0.85" />
              <stop offset="68%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${clipId}-eq)`}>
            <ellipse
              cx="50"
              cy="51"
              rx={34 + l.volume * 4}
              ry={6 + l.bass * 3}
              fill="none"
              stroke={`url(#${clipId}-equator)`}
              strokeWidth={1.8 + l.volume * 1.2}
              opacity={energy}
            />
            <circle
              cx={68 + l.treble * 4}
              cy={50}
              r={3.5 + flare * 5}
              fill="#f0f9ff"
              opacity={flare}
              style={{ filter: "blur(2px)" }}
            />
            <circle
              cx={68 + l.treble * 4}
              cy={50}
              r={1.2 + flare * 2}
              fill="#ffffff"
              opacity={Math.min(1, flare + 0.2)}
            />
          </g>
        </svg>
      </div>

      <div
        className="pointer-events-none absolute inset-1 rounded-full border transition-opacity duration-200"
        style={{
          borderColor: `rgba(125, 211, 252, ${rim})`,
          boxShadow: speaking
            ? `0 0 ${8 + energy * 14}px rgba(56, 189, 248, ${0.35 + energy * 0.45}), inset 0 0 12px rgba(125, 211, 252, 0.12)`
            : `0 0 10px rgba(56, 189, 248, ${0.2 + rim * 0.25})`,
          opacity: active ? 1 : 0.5,
        }}
      />
    </div>
  );
}
