export const PLUMBING_MID_CALL_SILENCE_CUE = "[plumbing-mid-call-silence]";

/** Wait after caller speaks before nudging a silent model mid-conversation (ms). */
export const PLUMBING_MID_CALL_SILENCE_MS = 3_500;

/** Minimum gap between mid-call silence nudges (ms). */
export const PLUMBING_MID_CALL_NUDGE_COOLDOWN_MS = 15_000;

/** Clear suppressAssistantAudio if turnComplete never arrives after barge-in (ms). */
export const PLUMBING_SUPPRESS_AUDIO_RECOVERY_MS = 4_000;

/** Hidden nudge when the caller spoke mid-call but Jarvis stayed quiet. */
export function buildPlumbingMidCallSilenceNudge(): string {
  return (
    `${PLUMBING_MID_CALL_SILENCE_CUE} The caller just spoke and is waiting for you. ` +
    `Respond now to their plumbing question or continue the conversation naturally. ` +
    `Do NOT repeat your introduction. Do NOT stay silent.`
  );
}
