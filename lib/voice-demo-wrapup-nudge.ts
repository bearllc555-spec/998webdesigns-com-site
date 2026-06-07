import { isAssistantFarewell } from "@/lib/voice-demo-farewell";

/** Fixed wrap-up question cycle — Q1→Q4, then repeat. */
export const VOICE_DEMO_WRAPUP_QUESTIONS = [
  "Is there anything else I can help you with today?",
  "Did I address all your concerns today?",
  "Any other question?",
  "Anything else?",
] as const;

/** Hidden client cue — never spoken aloud; nudges Jarvis after a post-answer pause. */
export const VOICE_DEMO_WRAPUP_PAUSE_CUE = "[wrap-up-pause]";

/** Comfortable beat after an answer before the next wrap-up question (ms). */
export const WRAPUP_POST_ANSWER_PAUSE_MS = 3000;

const WRAPUP_EXCLUDE_PATTERNS = [
  /how may i help/i,
  /pleasure of speaking/i,
  /who do i have/i,
  /coupon code via email/i,
  /something cool/i,
  /zip code/i,
  /cell number|phone number|mobile number|us cell/i,
  /didn't get that/i,
  /verification code/i,
  /i'm jarvis/i,
];

/** Assistant turn already contains a wrap-up cycle question. */
export function isAssistantWrapUpQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  for (const q of VOICE_DEMO_WRAPUP_QUESTIONS) {
    if (t.includes(q.toLowerCase())) return true;
  }
  return false;
}

export function shouldScheduleWrapUpAfterAnswer(
  text: string,
  opts: { awaitingCollection: boolean; farewellSent: boolean }
): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 24) return false;
  if (opts.awaitingCollection || opts.farewellSent) return false;
  if (isAssistantWrapUpQuestion(trimmed)) return false;
  if (isAssistantFarewell(trimmed)) return false;
  for (const pattern of WRAPUP_EXCLUDE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  return true;
}

export function buildWrapUpPauseNudge(): string {
  return (
    `${VOICE_DEMO_WRAPUP_PAUSE_CUE} You finished answering the visitor's question. ` +
    `The comfortable pause is over — ask exactly ONE next wrap-up question from the WRAP-UP QUESTION CYCLE (advance to the next Q in order), ` +
    `then STOP and wait for their answer. Do not add another topic or question in the same turn.`
  );
}
