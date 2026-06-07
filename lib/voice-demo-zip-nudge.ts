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

export const ZIP_SILENCE_NUDGE_MS = 1200;

/** Wait a few seconds for yes/no before the "I didn't get that" repeat. */
export const WEATHER_YESNO_SILENCE_NUDGE_MS = 3000;

export function countSpokenZipDigits(transcript: string): number {
  return transcript.replace(/\D/g, "").length;
}

export function buildZipPauseNudge(transcript: string): string {
  const trimmed = transcript.trim();
  const digits = countSpokenZipDigits(trimmed);
  const zip = normalizeUsZipCode(trimmed);

  if (zip) {
    return (
      `${VOICE_DEMO_ZIP_PAUSE_CUE} Visitor stopped speaking. Transcript: "${trimmed}". ` +
      `Call confirm_weather_zip now with zipCode "${zip}", speak spokenConfirm, pause, then lookup_weather alone.`
    );
  }

  if (digits > 0) {
    return (
      `${VOICE_DEMO_ZIP_PAUSE_CUE} Visitor stopped speaking but only ${digits} digit(s) in transcript: "${trimmed}". ` +
      `Say you did not catch the full five-digit ZIP and ask them to repeat it once, clearly.`
    );
  }

  return (
    `${VOICE_DEMO_ZIP_PAUSE_CUE} Visitor went quiet while you were collecting their ZIP. ` +
    `Gently ask for their five-digit US ZIP code.`
  );
}

export function buildWeatherYesNoPauseNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE} Visitor did not reply after the weather offer. ` +
    `Say exactly "${VOICE_DEMO_WEATHER_DIDNT_GET_LINE}" then ask exactly: "${VOICE_DEMO_WEATHER_REPEAT_LINE}" ` +
    `STOP and wait for yes or no again. Do not ask for ZIP yet.`
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

/** Visitor transcript looks like yes to the weather demo. */
export function isWeatherOfferAccept(transcript: string): boolean {
  return /\b(yes|yeah|yep|sure|ok|okay|please|why not|absolutely|definitely|go ahead)\b/i.test(
    transcript.trim()
  );
}
