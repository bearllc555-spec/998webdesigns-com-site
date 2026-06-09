"use client";

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

/** Plumbing voice orb — dark core, amplified rim when speaking, orbit dot when idle. */
export function PlumbingJarvisOrb({
  levels,
  speaking,
  connected,
  connecting,
}: PlumbingJarvisOrbProps) {
  const active = connected || connecting;
  const idleAlive = active && !speaking;
  const l = active ? levels : JARVIS_AUDIO_IDLE;

  const ringDrive =
    speaking && active ? Math.min(1, l.volume * 0.55 + l.mid * 0.3 + l.treble * 0.15) : 0;
  const ringScale = speaking ? 1 + ringDrive * 0.14 + l.bass * 0.06 : 1;
  const outerPulse = speaking ? 1.06 + ringDrive * 0.22 : 1;
  const rimWidth = speaking ? 2.5 + ringDrive * 3.5 : 2;
  const rimGlow = speaking ? 12 + ringDrive * 36 : 8;
  const rimInnerGlow = 6 + l.treble * 18;
  const rimOpacity = active ? (speaking ? 0.55 + ringDrive * 0.45 : 0.38) : 0.28;
  const outerRingOpacity = speaking ? 0.2 + ringDrive * 0.55 : 0;
  const cardHalo = speaking ? 0.12 + ringDrive * 0.4 : idleAlive ? 0.08 : 0.06;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center" aria-hidden>
      {/* Card halo — voice when speaking, soft when idle */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: active ? 1 : 0.4,
          transform: `scale(${outerPulse})`,
          boxShadow: `0 0 ${rimGlow}px rgba(56, 189, 248, ${cardHalo}), 0 0 ${rimGlow * 1.6}px rgba(37, 99, 235, ${cardHalo * 0.65})`,
        }}
      />

      {/* Outer voice ring — only while Jarvis speaks */}
      {speaking && (
        <div
          className="pointer-events-none absolute rounded-full border border-sky-300/80"
          style={{
            inset: `${6 - ringDrive * 4}px`,
            opacity: outerRingOpacity,
            transform: `scale(${1 + l.mid * 0.08 + l.treble * 0.06})`,
            borderWidth: `${1 + l.treble * 2}px`,
            boxShadow: `0 0 ${8 + l.mid * 20}px rgba(125, 211, 252, ${0.25 + l.mid * 0.5})`,
          }}
        />
      )}

      {/* Dark core — blank while idle */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "10px",
          background:
            "radial-gradient(circle at 50% 48%, #0f2238 0%, #081018 55%, #030608 100%)",
          boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.65)",
        }}
      />

      {/* Primary rim */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "4px",
          transform: `scale(${ringScale})`,
          border: `${rimWidth}px solid rgba(186, 230, 253, ${rimOpacity})`,
          boxShadow: speaking
            ? `0 0 ${rimGlow}px rgba(56, 189, 248, ${0.5 + ringDrive * 0.45}), 0 0 ${rimInnerGlow}px rgba(255, 255, 255, ${0.15 + l.treble * 0.35}), inset 0 0 ${10 + ringDrive * 14}px rgba(125, 211, 252, ${0.15 + ringDrive * 0.25})`
            : `0 0 ${rimGlow * 0.5}px rgba(56, 189, 248, ${0.2 + rimOpacity * 0.15})`,
        }}
      />

      {/* Idle alive — dot travels the rim */}
      {idleAlive && (
        <div
          className="pointer-events-none absolute inset-[4px] animate-[plumbing-orb-orbit_3.8s_linear_infinite]"
        >
          <div
            className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #ffffff 0%, #7dd3fc 45%, #0ea5e9 100%)",
              boxShadow:
                "0 0 6px rgba(125, 211, 252, 0.95), 0 0 12px rgba(56, 189, 248, 0.55)",
            }}
          />
        </div>
      )}

      {/* Bright equator accent on the ring when speaking */}
      {speaking && ringDrive > 0.08 && (
        <div
          className="pointer-events-none absolute overflow-hidden rounded-full"
          style={{
            inset: "4px",
            transform: `scale(${ringScale})`,
            opacity: 0.35 + l.volume * 0.65,
          }}
        >
          <div
            className="absolute left-[8%] right-[8%] top-1/2 h-[3px] -translate-y-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(125,211,252,0.4) 30%, rgba(255,255,255,0.95) 62%, rgba(56,189,248,0.35) 100%)",
              boxShadow: `0 0 ${6 + l.treble * 14}px rgba(255, 255, 255, ${0.35 + l.treble * 0.5})`,
              transform: `scaleX(${0.85 + l.volume * 0.2})`,
            }}
          />
        </div>
      )}
    </div>
  );
}
