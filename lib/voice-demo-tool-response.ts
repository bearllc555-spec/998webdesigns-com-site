import {
  FunctionResponseScheduling,
  type FunctionResponse,
} from "@google/genai";

export type VoiceDemoToolResponseEntry = FunctionResponse;

/** Tools where the model should act on the result without narrating the tool call. */
const SILENT_ON_SUCCESS = new Set([
  "decline_secondary_contact",
  "confirm_phone_number",
  "capture_email_for_promo",
  "send_promo_email",
  "send_promo_sms",
]);

/**
 * Model should speak from save_name / phone staging tool messages - not SILENT.
 * Blocked/error responses are always SILENT so Jarvis does not read error JSON aloud.
 */
export function shouldUseSilentToolScheduling(
  name: string,
  response: Record<string, unknown>
): boolean {
  if (response.ok === false) return true;
  return SILENT_ON_SUCCESS.has(name);
}

export function buildVoiceDemoToolResponse(
  id: string | undefined,
  name: string,
  response: Record<string, unknown>
): VoiceDemoToolResponseEntry {
  const entry: VoiceDemoToolResponseEntry = { id, name, response };
  if (shouldUseSilentToolScheduling(name, response)) {
    entry.scheduling = FunctionResponseScheduling.SILENT;
  }
  return entry;
}
