import { normalizePhoneE164 } from "@/lib/twilio-verify";

export const VOICE_DEMO_CALLBACK_SUMMARY_PREFIX = "Callback requested:";

export function formatVoiceDemoCallbackSummary(questionSummary: string): string {
  const trimmed = questionSummary.trim();
  return `${VOICE_DEMO_CALLBACK_SUMMARY_PREFIX} ${trimmed}`;
}

export function isVoiceDemoCallbackSummary(summary: string | null | undefined): boolean {
  return Boolean(summary?.trim().startsWith(VOICE_DEMO_CALLBACK_SUMMARY_PREFIX));
}

/** US callback number for marketing Jarvis — E.164 when possible. */
export function voiceDemoCallbackPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return normalizePhoneE164(trimmed);
}
