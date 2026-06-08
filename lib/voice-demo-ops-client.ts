import type { VoiceDemoOpsKind, VoiceDemoOpsSeverity } from "@/lib/voice-demo-ops";

export type VoiceDemoOpsClientInput = {
  kind: VoiceDemoOpsKind;
  message: string;
  severity?: VoiceDemoOpsSeverity;
  meta?: Record<string, unknown>;
};

export const VOICE_DEMO_OPS_EVENT = "voice-demo-ops";

/** Fire-and-forget ops log for live Jarvis sessions (persisted on voice_demo_leads.ops_log). */
export function logVoiceDemoOps(input: VoiceDemoOpsClientInput): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VOICE_DEMO_OPS_EVENT, { detail: input }));
  void fetch("/api/voice-demo/ops-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}
