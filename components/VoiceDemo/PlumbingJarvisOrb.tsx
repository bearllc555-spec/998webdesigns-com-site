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

/** Plumbing voice orb - hollow center, blurred dash when idle, hot rim when speaking. */
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
  const ringScale = speaking ? 1 + ringDrive * 0.22 + l.bass * 0.1 : 1;
  const outerPulse = speaking ? 1.1 + ringDrive * 0.34 : 1;
  const rimWidth = speaking ? 3 + ringDrive * 5 : 2;
  const rimGlow = speaking ? 20 + ringDrive * 32 : 8;
  const rimInnerGlow = 10 + l.treble * 28;
  const rimOpacity = active ? (speaking ? 0.65 + ringDrive * 0.35 : 0.38) : 0.28;
  const outerRingOpacity = speaking ? 0.35 + ringDrive * 0.65 : 0;
  const cardHalo = speaking ? 0.22 + ringDrive * 0.72 : idleAlive ? 0.08 : 0.06;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center" aria-hidden>
      {/* Card halo - exaggerated when Jarvis speaks */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: active ? 1 : 0.4,
          transform: `scale(${outerPulse})`,
          boxShadow: speaking
            ? `0 0 ${rimGlow}px rgba(56, 189, 248, ${cardHalo}), 0 0 ${rimGlow * 2.2}px rgba(37, 99, 235, ${cardHalo * 0.75}), 0 0 ${rimGlow * 3}px rgba(125, 211, 252, ${cardHalo * 0.35})`
            : `0 0 ${rimGlow}px rgba(56, 189, 248, ${cardHalo}), 0 0 ${rimGlow * 1.6}px rgba(37, 99, 235, ${cardHalo * 0.65})`,
        }}
      />

      {/* Outer voice ring - only while Jarvis speaks */}
      {speaking && (
        <div
          className="pointer-events-none absolute rounded-full border border-sky-200"
          style={{
            inset: `${4 - ringDrive * 6}px`,
            opacity: outerRingOpacity,
            transform: `scale(${1 + l.mid * 0.12 + l.treble * 0.1})`,
            borderWidth: `${1.5 + l.treble * 3}px`,
            boxShadow: `0 0 ${14 + l.mid * 32}px rgba(125, 211, 252, ${0.4 + l.mid * 0.55}), 0 0 ${24 + l.volume * 40}px rgba(56, 189, 248, ${0.2 + ringDrive * 0.4})`,
          }}
        />
      )}

      {/* Hollow ring - center stays blank (card shows through) */}
      <div
        className="pointer-events-none absolute rounded-full bg-transparent"
        style={{
          inset: "4px",
          transform: `scale(${ringScale})`,
          border: `${rimWidth}px solid rgba(186, 230, 253, ${rimOpacity})`,
          boxShadow: speaking
            ? `0 0 ${rimGlow}px rgba(56, 189, 248, ${0.65 + ringDrive * 0.35}), 0 0 ${rimInnerGlow}px rgba(255, 255, 255, ${0.25 + l.treble * 0.45}), 0 0 ${rimGlow * 1.4}px rgba(14, 165, 233, ${0.35 + ringDrive * 0.3})`
            : `0 0 ${rimGlow * 0.5}px rgba(56, 189, 248, ${0.2 + rimOpacity * 0.15})`,
        }}
      />

      {/* Idle - blurred dash travels the rim */}
      {idleAlive && (
        <div className="pointer-events-none absolute inset-[4px] animate-[plumbing-orb-orbit_6.5s_linear_infinite]">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: "11px",
              height: "2.5px",
              borderRadius: "9999px",
              background:
                "linear-gradient(90deg, rgba(56,189,248,0.15) 0%, rgba(186,230,253,0.95) 50%, rgba(56,189,248,0.15) 100%)",
              boxShadow: "0 0 8px rgba(125, 211, 252, 0.85), 0 0 14px rgba(56, 189, 248, 0.45)",
              filter: "blur(0.65px)",
            }}
          />
        </div>
      )}

    </div>
  );
}
