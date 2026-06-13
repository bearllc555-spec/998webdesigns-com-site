import { PLUMBING_DEMO_OPENING_LINE } from "@/lib/voice-demo-plumbing-constants";

export const PLUMBING_POST_OPENING_CUE = "[plumbing-post-opening]";

/** Wait after caller speaks before nudging a silent model (ms). */
export const PLUMBING_POST_OPENING_IDLE_MS = 2_500;

export function isPlumbingOpeningLine(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  const canonical = PLUMBING_DEMO_OPENING_LINE.toLowerCase();
  if (t.includes(canonical.slice(0, 40))) return true;
  return (
    /\bthanks for calling\b/.test(t) &&
    /\b(i'?m jarvis|this is jarvis)\b/.test(t) &&
    /\bhow can i help you\b/.test(t)
  );
}

export const PLUMBING_POST_OPENING_LISTEN = `AFTER OPENING (critical):
- Your opening is done. When the caller speaks, respond immediately - listen to their plumbing issue or question and help them.
- Never stay silent after they talk. Do not repeat the full introduction.`;

/** Hidden nudge when the caller spoke after the opening but Jarvis stayed quiet. */
export function buildPlumbingPostOpeningListenNudge(): string {
  return (
    `${PLUMBING_POST_OPENING_CUE} You already introduced yourself and asked how you can help. ` +
    `The caller is speaking - respond now: address their plumbing question or problem in plain language. ` +
    `Do NOT repeat the opening greeting. Do NOT stay silent.`
  );
}
