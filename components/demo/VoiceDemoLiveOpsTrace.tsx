"use client";

import { useEffect, useState } from "react";
import { VoiceDemoOpsTimeline } from "@/components/demo/VoiceDemoOpsTimeline";
import { buildVoiceDemoOpsEvent } from "@/lib/voice-demo-ops";
import type { VoiceDemoOpsEvent } from "@/lib/voice-demo-ops";
import {
  VOICE_DEMO_OPS_EVENT,
  type VoiceDemoOpsClientInput,
} from "@/lib/voice-demo-ops-client";

const LIVE_OPS_MAX = 40;

/** Live tail of Jarvis ops events during an active voice session (same data persisted to Supabase). */
export function VoiceDemoLiveOpsTrace() {
  const [events, setEvents] = useState<VoiceDemoOpsEvent[]>([]);

  useEffect(() => {
    function onOps(e: Event) {
      const detail = (e as CustomEvent<VoiceDemoOpsClientInput>).detail;
      if (!detail?.kind || !detail.message) return;
      const ev = buildVoiceDemoOpsEvent(
        detail.kind,
        detail.message,
        detail.meta,
        detail.severity
      );
      setEvents((prev) => [...prev, ev].slice(-LIVE_OPS_MAX));
    }
    window.addEventListener(VOICE_DEMO_OPS_EVENT, onOps);
    return () => window.removeEventListener(VOICE_DEMO_OPS_EVENT, onOps);
  }, []);

  if (!events.length) return null;

  return (
    <VoiceDemoOpsTimeline
      events={events}
      title="Live session trace"
      defaultExpanded={events.some((e) => e.severity === "warn" || e.severity === "error")}
    />
  );
}
