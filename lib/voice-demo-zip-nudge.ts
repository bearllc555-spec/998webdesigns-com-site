import { VOICE_DEMO_GOODBYE_LINE } from "@/lib/voice-demo-constants";
import {
  normalizeUsZipCode,
  VOICE_DEMO_WEATHER_DIDNT_GET_LINE,
  VOICE_DEMO_WEATHER_REPEAT_LINE,
} from "@/lib/voice-demo-weather";

/** Hidden client cue — never spoken aloud; nudges Jarvis after ZIP-digit silence. */
export const VOICE_DEMO_ZIP_PAUSE_CUE = "[zip-input-pause]";

/** Hidden cue when visitor goes quiet after the yes/no weather offer. */
export const VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE = "[weather-yesno-pause]";

/** Hidden cue when visitor declines the weather demo. */
export const VOICE_DEMO_WEATHER_DECLINE_CUE = "[weather-offer-declined]";

/** Hidden cue when visitor stays silent after the repeat weather offer. */
export const VOICE_DEMO_WEATHER_YESNO_GIVEUP_CUE = "[weather-yesno-giveup]";

/** Wait for full ZIP utterance before staging (ms). */
export const ZIP_SILENCE_NUDGE_MS = 2500;

/** Wait a few seconds for yes/no before the "I didn't get that" repeat. */
export const WEATHER_YESNO_SILENCE_NUDGE_MS = 3000;

export function countSpokenZipDigits(transcript: string): number {
  return transcript.replace(/\D/g, "").length;
}

/** Returns null when a client nudge would duplicate an ask Jarvis already made. */
export function buildZipPauseNudge(transcript: string): string | null {
  const trimmed = transcript.trim();
  const digits = countSpokenZipDigits(trimmed);
  const zip = normalizeUsZipCode(trimmed);

  if (zip) {
    return (
      `${VOICE_DEMO_ZIP_PAUSE_CUE} Visitor stopped speaking. Transcript: "${trimmed}". ` +
      `Call confirm_weather_zip now with zipCode "${zip}", speak spokenConfirm once, and STOP — wait for yes or no. ` +
      `Do NOT ask for their ZIP again. Do NOT call lookup_weather until they confirm. ` +
      `On yes, lookup_weather with userConfirmed true and the same ZIP.`
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
    `Say exactly: "${VOICE_DEMO_GOODBYE_LINE}" then STOP and call end_conversation immediately. ` +
    `Do not ask again. Do not offer weather or promo.`
  );
}

export function buildWeatherDeclineNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_DECLINE_CUE} Visitor declined the weather demo. ` +
    `Continue FINAL GOODBYE: follow PROMO OFFER rules if needed, then warm sign-off and call end_conversation.`
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
