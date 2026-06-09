import {
  assistantFarewellTail,
  isAssistantFarewell,
} from "@/lib/voice-demo-farewell";
import { PLUMBING_DEMO_BUSINESS_NAME } from "@/lib/voice-demo-plumbing-constants";

/** Natural pause before Jarvis signs off after the caller confirms concerns. */
export const PLUMBING_GOODBYE_BEAT_MS = 1_800;

export const PLUMBING_GOODBYE_BEAT_CUE = "[plumbing-goodbye-beat]";

export const PLUMBING_EXIT_CONCERNS_CUE = "[plumbing-exit-concerns]";

export const PLUMBING_EXIT_CONCERNS_QUESTION =
  "Did I address all your concerns today?";

export const PLUMBING_FINAL_GOODBYE_CUE = "[plumbing-final-goodbye]";

export function buildPlumbingExitConcernsNudge(): string {
  return (
    `${PLUMBING_EXIT_CONCERNS_CUE} The caller is wrapping up the call. ` +
    `Say ONLY this exact question — no preamble, no meta commentary: ` +
    `"${PLUMBING_EXIT_CONCERNS_QUESTION}"`
  );
}

export function buildPlumbingFinalGoodbyeNudge(): string {
  return (
    `${PLUMBING_FINAL_GOODBYE_CUE} The caller confirmed their concerns were addressed. ` +
    `Give ONE brief, warm sign-off thanking them for calling ${PLUMBING_DEMO_BUSINESS_NAME} and say goodbye. ` +
    `Relaxed and human, not rushed. Do not echo their goodbye instantly; a beat of silence already passed. ` +
    `Do NOT ask more questions — this is your final line.`
  );
}

/** @deprecated Use buildPlumbingFinalGoodbyeNudge — kept for test compatibility. */
export function buildPlumbingGoodbyeBeatNudge(): string {
  return buildPlumbingFinalGoodbyeNudge();
}

/** Jarvis delivered the plumbing final sign-off (thanks for calling + goodbye). */
export function isPlumbingAssistantFarewell(text: string): boolean {
  if (isAssistantFarewell(text)) return true;
  const tail = assistantFarewellTail(text).toLowerCase();
  if (!tail) return false;
  // Opening greets with "thanks for calling" — require a sign-off cue, not greeting alone.
  if (/\b(thanks for calling|thank you for calling)\b/.test(tail)) {
    return (
      /\b(goodbye|good bye|take care|have a (good|great|nice|wonderful))\b/.test(tail) ||
      /\b(call us|reach out|talk soon)\b/.test(tail)
    );
  }
  if (/\b(thank you|thanks)\b/.test(tail) && /\b(goodbye|good bye|good day)\b/.test(tail)) {
    return true;
  }
  return false;
}
