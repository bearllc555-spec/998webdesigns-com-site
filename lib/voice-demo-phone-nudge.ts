/** Hidden client cue - never spoken aloud; nudges Jarvis after phone-digit silence. */
export const VOICE_DEMO_PHONE_PAUSE_CUE = "[phone-input-pause]";

export const PHONE_SILENCE_NUDGE_MS = 2000;

/** Count digits in a spoken or transcribed phone utterance. */
export function countSpokenPhoneDigits(transcript: string): number {
  return transcript.replace(/\D/g, "").length;
}

/** Build the hidden nudge Jarvis receives when the visitor stops speaking their number. */
export function buildPhonePauseNudge(transcript: string): string {
  const trimmed = transcript.trim();
  const digits = countSpokenPhoneDigits(trimmed);

  if (digits >= 10) {
    return (
      `${VOICE_DEMO_PHONE_PAUSE_CUE} Visitor stopped speaking. Transcript: "${trimmed}". ` +
      `Call stage_phone_number now with the digits you heard, smsConsent true, then read spoken back once and ask if correct.`
    );
  }

  if (digits > 0) {
    return (
      `${VOICE_DEMO_PHONE_PAUSE_CUE} Visitor stopped speaking but only ${digits} digit(s) in transcript: "${trimmed}". ` +
      `Say you did not catch the full ten-digit cell number and ask them to repeat it once, clearly.`
    );
  }

  return (
    `${VOICE_DEMO_PHONE_PAUSE_CUE} Visitor went quiet while you were collecting their cell. ` +
    `Gently ask for their US cell number when ready.`
  );
}
