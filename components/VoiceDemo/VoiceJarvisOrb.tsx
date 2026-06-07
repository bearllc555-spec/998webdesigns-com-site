"use client";

import {
  JARVIS_AUDIO_IDLE,
  type JarvisAudioLevels,
} from "@/lib/voice-demo-jarvis-audio-level";

type VoiceJarvisOrbProps = {
  levels: JarvisAudioLevels;
  speaking: boolean;
  connected: boolean;
  connecting: boolean;
};

export function VoiceJarvisOrb({
  levels,
  speaking,
  connected,
  connecting,
}: VoiceJarvisOrbProps) {
  const active = connected || connecting;
  const l = active ? levels : JARVIS_AUDIO_IDLE;

  const scale = 1 + l.volume * 0.28 + l.bass * 0.12;
  const glow = 0.25 + l.volume * 0.75 + l.treble * 0.35;
  const ringScale = 1 + l.mid * 0.22 + l.treble * 0.18;
  const coreOpacity = active ? 0.55 + l.volume * 0.45 : 0.35;
  const shimmer = l.treble * 0.9;

  return (
    <div
      className={`relative flex h-28 w-28 items-center justify-center ${
        active && !speaking ? "animate-[jarvis-breathe_3.2s_ease-in-out_infinite]" : ""
      }`}
      aria-hidden
    >
      <div
        className={`absolute inset-2 transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-40"
        }`}
        style={{
          transform: `scale(${scale})`,
          background: `radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--accent) ${Math.round(55 + l.treble * 35)}%, white) 0%, var(--accent) 42%, var(--accent-deep) 100%)`,
          borderRadius: "9999px",
          boxShadow: speaking
            ? `0 0 ${12 + glow * 28}px color-mix(in srgb, var(--accent) ${Math.round(40 + glow * 50)}%, transparent), 0 0 ${4 + shimmer * 12}px color-mix(in srgb, white ${Math.round(shimmer * 40)}%, transparent)`
            : `0 0 16px color-mix(in srgb, var(--accent) 28%, transparent)`,
          opacity: coreOpacity,
        }}
      />

      <div
        className="pointer-events-none absolute inset-3 rounded-full border border-white/25"
        style={{
          transform: `scale(${ringScale})`,
          opacity: 0.35 + l.mid * 0.5,
        }}
      />

      <div
        className="pointer-events-none absolute inset-5 rounded-full"
        style={{
          transform: `scale(${0.85 + l.bass * 0.2})`,
          background: `radial-gradient(circle, color-mix(in srgb, white ${Math.round(25 + l.volume * 45)}%, transparent) 0%, transparent 70%)`,
          opacity: 0.5 + l.volume * 0.5,
        }}
      />

      {speaking && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full border border-accent/40"
          style={{
            transform: `scale(${1.05 + l.volume * 0.15})`,
            opacity: 0.25 + l.treble * 0.55,
          }}
        />
      )}
    </div>
  );
}
