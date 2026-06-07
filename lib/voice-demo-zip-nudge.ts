import { VOICE_DEMO_GOODBYE_LINE } from "@/lib/voice-demo-constants";
import { normalizeVerificationCode } from "@/lib/voice-demo-code";
import {
  normalizeSpokenUsZipCode,
  normalizeUsZipCode,
  VOICE_DEMO_WEATHER_DIDNT_GET_LINE,
  VOICE_DEMO_WEATHER_REPEAT_LINE,
  VOICE_DEMO_WEATHER_ZIP_ASK_LINE,
  VOICE_DEMO_ZIP_DIDNT_GET_LINE,
} from "@/lib/voice-demo-weather";

/** Hidden client cue — never spoken aloud; nudges Jarvis after ZIP-digit silence. */
export const VOICE_DEMO_ZIP_PAUSE_CUE = "[zip-input-pause]";

/** Hidden cue when visitor goes quiet after the yes/no weather offer. */
export const VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE = "[weather-yesno-pause]";

/** Hidden cue when visitor declines the weather demo. */
export const VOICE_DEMO_WEATHER_DECLINE_CUE = "[weather-offer-declined]";

/** Hidden cue when visitor stays silent after the repeat weather offer. */
export const VOICE_DEMO_WEATHER_YESNO_GIVEUP_CUE = "[weather-yesno-giveup]";

/** Hidden cue — visitor silent after ZIP ask (first time). */
export const VOICE_DEMO_ZIP_SILENCE_REPEAT_CUE = "[zip-silence-repeat]";

/** Hidden cue — visitor still silent after ZIP repeat ask. */
export const VOICE_DEMO_ZIP_SILENCE_GIVEUP_CUE = "[zip-silence-giveup]";

/** Hidden cue — client staged ZIP via confirm_weather_zip; Jarvis must read spokenConfirm. */
export const VOICE_DEMO_ZIP_STAGED_CUE = "[zip-staged]";

/** Hidden cue — Jarvis named the wrong city on ZIP read-back; repeat spokenConfirm only. */
export const VOICE_DEMO_ZIP_CITY_CORRECT_CUE = "[zip-city-correct]";

/** Wait for full ZIP utterance before staging (ms). */
export const ZIP_SILENCE_NUDGE_MS = 2500;

/** Re-send staged ZIP read-back if Jarvis stays silent after client staging (ms). */
export const ZIP_STAGING_WATCHDOG_MS = 8000;

/** Wait a few seconds for yes/no before the "I didn't get that" repeat. */
export const WEATHER_YESNO_SILENCE_NUDGE_MS = 3000;

export function countSpokenZipDigits(transcript: string): number {
  const digits = transcript.replace(/\D/g, "").length;
  if (digits > 0) return digits;
  return normalizeVerificationCode(transcript).length;
}

/** Hidden cue — Jarvis said goodbye before ZIP read-back; recover the flow. */
export const VOICE_DEMO_ZIP_GOODBYE_BLOCKED_CUE = "[zip-goodbye-blocked]";

/** Hidden cue — wrap-up question during active weather ZIP flow; redirect to ZIP. */
export const VOICE_DEMO_ZIP_WRAPUP_BLOCKED_CUE = "[zip-wrapup-blocked]";

export function buildWeatherZipWrapUpBlockedNudge(): string {
  return (
    `${VOICE_DEMO_ZIP_WRAPUP_BLOCKED_CUE} Weather demo is still in progress — do NOT ask wrap-up questions yet. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_ZIP_ASK_LINE}" then STOP and wait for their five-digit ZIP. ` +
    `No "anything else", no goodbye, no promo until weather finishes or they decline.`
  );
}

/** Visitor reminds Jarvis they asked for ZIP / weather. */
export function isUserWeatherZipReminder(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(you (just |already )?asked|asked (me )?for).{0,40}\b(zip|weather)\b/i.test(t) ||
    /\b(we were|still).{0,32}\b(zip|weather)\b/i.test(t) ||
    /\bzip code.{0,24}\b(you|asked)\b/i.test(t)
  );
}

export function buildWeatherZipPrematureGoodbyeRecoveryNudge(): string {
  return (
    `${VOICE_DEMO_ZIP_GOODBYE_BLOCKED_CUE} You must NOT say goodbye or call end_conversation yet. ` +
    `The visitor gave a ZIP — wait for hidden cue ${VOICE_DEMO_ZIP_STAGED_CUE}, then speak spokenConfirm word for word and STOP. ` +
    `If you have not heard five digits yet, say ONLY: "${VOICE_DEMO_WEATHER_ZIP_ASK_LINE}" and wait. ` +
    `No thank-you sign-off until after the weather forecast or they decline.`
  );
}

/** Returns null when a client nudge would duplicate an ask Jarvis already made. */
export function buildZipStagedSpeakNudge(spokenConfirm: string): string {
  return (
    `${VOICE_DEMO_ZIP_STAGED_CUE} confirm_weather_zip succeeded. ` +
    `Say ONLY this exact sentence — no words before it, no other city names, no preamble: ` +
    `"${spokenConfirm}" STOP and wait for yes or no. ` +
    `Never guess a nearby town (e.g. Paterson for 07512 — the tool city is Totowa). ` +
    `Do NOT call lookup_weather until they confirm.`
  );
}

export function buildZipCityCorrectionNudge(spokenConfirm: string): string {
  return (
    `${VOICE_DEMO_ZIP_CITY_CORRECT_CUE} You named the wrong city on the ZIP read-back. ` +
    `Say ONLY this exact sentence — nothing before or after: "${spokenConfirm}" ` +
    `STOP and wait for yes or no. Do NOT call lookup_weather yet.`
  );
}

export function buildZipPauseNudge(transcript: string): string | null {
  const trimmed = transcript.trim();
  const digits = countSpokenZipDigits(trimmed);
  const zip = normalizeSpokenUsZipCode(trimmed);

  if (zip) {
    return (
      `${VOICE_DEMO_ZIP_PAUSE_CUE} Visitor stopped speaking with ZIP "${zip}" in transcript: "${trimmed}". ` +
      `The client is staging this ZIP — wait for hidden cue ${VOICE_DEMO_ZIP_STAGED_CUE}, then speak spokenConfirm word for word and STOP. ` +
      `Do NOT call confirm_weather_zip yourself. Do NOT call lookup_weather until they confirm yes on the read-back.`
    );
  }

  if (digits > 0) {
    return (
      `${VOICE_DEMO_ZIP_PAUSE_CUE} Visitor stopped speaking but only ${digits} digit(s) in transcript: "${trimmed}". ` +
      `Say you did not catch the full five-digit ZIP and ask them to repeat it once, clearly — do not ask twice in a row.`
    );
  }

  return null;
}

export function buildZipSilenceRepeatNudge(): string {
  return (
    `${VOICE_DEMO_ZIP_SILENCE_REPEAT_CUE} Visitor did not reply after the ZIP ask. ` +
    `Say exactly "${VOICE_DEMO_ZIP_DIDNT_GET_LINE}" then ask exactly: "${VOICE_DEMO_WEATHER_ZIP_ASK_LINE}" ` +
    `STOP and wait for their ZIP — do not say goodbye or call end_conversation in this turn.`
  );
}

export function buildZipSilenceGiveUpNudge(): string {
  return (
    `${VOICE_DEMO_ZIP_SILENCE_GIVEUP_CUE} Visitor did not reply after the ZIP repeat ask. ` +
    `Say exactly: "${VOICE_DEMO_GOODBYE_LINE}" once, then STOP and call end_conversation immediately. ` +
    `Never repeat the goodbye. Do not ask for the ZIP again. Do not offer weather or promo.`
  );
}

export function buildWeatherYesNoPauseNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE} Visitor did not reply after the weather offer. ` +
    `Say exactly "${VOICE_DEMO_WEATHER_DIDNT_GET_LINE}" then ask exactly: "${VOICE_DEMO_WEATHER_REPEAT_LINE}" ` +
    `STOP and wait for yes or no — do not say anything else in that turn. Do not ask for ZIP yet.`
  );
}

export function buildWeatherYesNoGiveUpNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_YESNO_GIVEUP_CUE} Visitor did not reply after the repeat weather offer. ` +
    `Say exactly: "${VOICE_DEMO_GOODBYE_LINE}" once, then STOP and call end_conversation immediately. ` +
    `Never repeat the goodbye. Do not ask again. Do not offer weather or promo.`
  );
}

export function buildWeatherDeclineNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_DECLINE_CUE} Visitor declined the weather demo. ` +
    `Continue FINAL GOODBYE: follow PROMO OFFER rules if needed, then warm sign-off and call end_conversation.`
  );
}

/** Hidden cue — visitor accepted weather; Jarvis must ask for ZIP only. */
export const VOICE_DEMO_WEATHER_ACCEPT_ZIP_CUE = "[weather-accepted]";

export function buildWeatherAcceptZipNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_ACCEPT_ZIP_CUE} Visitor accepted the weather demo. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_ZIP_ASK_LINE}" then STOP and wait for their five-digit ZIP. ` +
    `Do NOT mention coupons, promo, or email until weather is finished or they decline.`
  );
}

/** Hidden cue — promo ask during active weather ZIP flow. */
export const VOICE_DEMO_PROMO_WEATHER_BLOCKED_CUE = "[promo-weather-blocked]";

export function buildPromoBlockedDuringWeatherNudge(): string {
  return (
    `${VOICE_DEMO_PROMO_WEATHER_BLOCKED_CUE} Weather demo is in progress — do NOT offer or send promo yet. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_ZIP_ASK_LINE}" then STOP and wait for their ZIP. ` +
    `No coupon, no email ask, no goodbye until weather completes or they decline.`
  );
}

export function buildPromoBlockedDuringZipConfirmNudge(spokenConfirm: string): string {
  return (
    `${VOICE_DEMO_PROMO_WEATHER_BLOCKED_CUE} Weather demo is NOT finished — do NOT offer coupon or email yet. ` +
    `Say ONLY this exact ZIP read-back, then STOP and wait for yes or no: "${spokenConfirm}" ` +
    `After they confirm yes, stay silent — the client will fetch weather. No goodbye.`
  );
}

/** Hidden cue — visitor said yes but ZIP digits still needed (not promo consent). */
export const VOICE_DEMO_ZIP_AMBIGUOUS_YES_CUE = "[zip-ambiguous-yes]";

export function buildZipOnlyAfterAmbiguousYesNudge(): string {
  return (
    `${VOICE_DEMO_ZIP_AMBIGUOUS_YES_CUE} Visitor said yes but the weather ZIP is still missing. ` +
    `That was NOT promo permission — ignore coupon threads. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_ZIP_ASK_LINE}" then STOP and wait for five digits. ` +
    `Do not call send_promo_email.`
  );
}

/** Visitor transcript looks like a clear no to the weather demo. */
export function isWeatherOfferDecline(transcript: string): boolean {
  return /\b(no|nah|nope|not really|don't|do not|pass|skip|i'm good|im good)\b/i.test(
    transcript.trim()
  );
}

/** Visitor said yes to the staged ZIP read-back. */
export function isWeatherZipConfirmAccept(transcript: string): boolean {
  return /\b(yes|yeah|yep|sure|ok|okay|correct|that's right|that is right|right|absolutely|affirmative)\b/i.test(
    transcript.trim()
  );
}

/** Visitor rejected the staged ZIP read-back. */
export function isWeatherZipConfirmDecline(transcript: string): boolean {
  return /\b(no|nah|nope|wrong|incorrect|not right|that's wrong|that is wrong)\b/i.test(
    transcript.trim()
  );
}

/** Visitor transcript looks like yes to the weather demo. */
export function isWeatherOfferAccept(transcript: string): boolean {
  return /\b(yes|yeah|yep|sure|ok|okay|please|why not|absolutely|definitely|go ahead)\b/i.test(
    transcript.trim()
  );
}
