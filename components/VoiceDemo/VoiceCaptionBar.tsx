"use client";

import { useEffect, useRef } from "react";
import type { VoiceDemoCaption } from "@/lib/voice-demo-caption";

type VoiceCaptionBarProps = {
  caption: VoiceDemoCaption;
};

export function VoiceCaptionBar({ caption }: VoiceCaptionBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [caption.text, caption.role]);

  return (
    <div
      className="shrink-0 border-t border-rule bg-rule-soft/60 px-3 py-2.5"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span className="shrink-0 font-medium text-accent">You:</span>
        <span className="text-ink">{caption.text}</span>
      </div>
    </div>
  );
}
