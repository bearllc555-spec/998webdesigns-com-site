import { isAssistantFarewell } from "@/lib/voice-demo-farewell";

/** Fixed wrap-up question cycle - Q1→Q5, then repeat. */
export const VOICE_DEMO_WRAPUP_QUESTIONS = [
  "Is there anything else I can help you with today?",
  "Do you have any other questions?",
  "Any other question?",
  "Anything else?",
  "Did I address all your concerns today?",
] as const;

/** Hidden client cue - never spoken aloud; nudges Jarvis to ask the next wrap-up question. */
export const VOICE_DEMO_WRAPUP_READY_CUE = "[wrapup-ready]";

/** @deprecated Use VOICE_DEMO_WRAPUP_READY_CUE - old tag caused Jarvis to say "pause" aloud. */
export const VOICE_DEMO_WRAPUP_PAUSE_CUE = VOICE_DEMO_WRAPUP_READY_CUE;

/** Comfortable beat after a substantive FAQ answer before the next wrap-up question (ms). */
export const WRAPUP_POST_ANSWER_PAUSE_MS = 4000;

const SMALL_TALK_USER_PATTERNS = [
  /\bhow are you\b/i,
  /\bhow'?s it going\b/i,
  /\bhow have you been\b/i,
  /\bhow you doing\b/i,
  /\bwhat'?s up\b/i,
  /\bgood (morning|afternoon|evening)\b/i,
  /\bnice to (meet|talk|speak)\b/i,
  /\bhow do you do\b/i,
  /\bdoing (well|good|great|fine|ok|okay|alright)\b/i,
];

const SUBSTANTIVE_USER_PATTERNS = [
  /\b(how much|pricing|price|cost|fee|hosting|timeline|website|portfolio|coupon|discount|998|services?|design)\b/i,
  /\b(tell me|what do you|can you|do you offer|how long|how does)\b/i,
];

const WRAPUP_EXCLUDE_PATTERNS = [
  /how may i help/i,
  /pleasure of speaking/i,
  /who do i have/i,
  /coupon code/i,
  /cell number|phone number|mobile number|us cell/i,
  /didn't get that/i,
  /verification code/i,
  /i'm jarvis/i,
  /how may i help you today/i,
];

const SMALL_TALK_REPLY_PATTERNS = [
  /\bi'?m (?:doing )?(?:well|fine|great|good|splendid|quite well)/i,
  /\bthank you for asking\b/i,
  /\bnot too bad\b/i,
  /\ball is well\b/i,
  /\bpleasure to (meet|speak|talk)\b/i,
];

/** Visitor pleasantry - not a product/FAQ question. */
export function isUserSmallTalk(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (SMALL_TALK_USER_PATTERNS.some((p) => p.test(t))) return true;
  if (t.length < 24 && /^(hi|hey|hello|thanks|thank you|good)\b/.test(t)) return true;
  return false;
}

/** Visitor asked about 998 services - eligible for post-answer wrap-up later. */
export function isUserSubstantiveQuestion(text: string): boolean {
  const t = text.trim();
  if (!t || isUserSmallTalk(t)) return false;
  if (SUBSTANTIVE_USER_PATTERNS.some((p) => p.test(t))) return true;
  if (/\?/.test(t) && t.length >= 10) return true;
  return false;
}

/** Assistant answered small talk only - no wrap-up yet. */
export function isAssistantSmallTalkReply(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || isAssistantWrapUpQuestion(trimmed)) return false;
  const t = trimmed.toLowerCase();
  const hasSmallTalk = SMALL_TALK_REPLY_PATTERNS.some((p) => p.test(t));
  const hasSubstantive =
    /\b(design fee|hosting|pricing|\$|998|website|timeline|portfolio)\b/i.test(t);
  return hasSmallTalk && !hasSubstantive;
}

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
  opts: {
    awaitingCollection: boolean;
    farewellSent: boolean;
    visitorAskedSubstantiveQuestion: boolean;
  }
): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 24) return false;
  if (opts.awaitingCollection || opts.farewellSent) return false;
  if (!opts.visitorAskedSubstantiveQuestion) return false;
  if (isAssistantWrapUpQuestion(trimmed)) return false;
  if (isAssistantFarewell(trimmed)) return false;
  if (isAssistantSmallTalkReply(trimmed)) return false;
  for (const pattern of WRAPUP_EXCLUDE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  return true;
}

/** Jarvis read a hidden cue or meta instruction aloud - recover with the real wrap-up line. */
export function isAssistantHiddenCueLeak(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\[[a-z0-9-]+\]/i.test(t)) return true;
  if (/^pause[.!?,]?\s*$/i.test(t)) return true;
  if (/wrap[- ]?up[- ]?pause/i.test(t)) return true;
  if (/comfortable pause/i.test(t)) return true;
  if (/\bwrapup[- ]?ready\b/i.test(t)) return true;
  if (t.length <= 64 && /\b(hidden|internal)\s+cue\b/i.test(t)) return true;
  return false;
}

export function wrapUpQuestionAtIndex(index: number): string {
  const safe = ((index % VOICE_DEMO_WRAPUP_QUESTIONS.length) + VOICE_DEMO_WRAPUP_QUESTIONS.length) %
    VOICE_DEMO_WRAPUP_QUESTIONS.length;
  return VOICE_DEMO_WRAPUP_QUESTIONS[safe]!;
}

export function buildWrapUpPauseNudge(questionIndex = 0): string {
  const q = wrapUpQuestionAtIndex(questionIndex);
  return (
    `${VOICE_DEMO_WRAPUP_READY_CUE} Say ONLY this exact question - no preamble, no meta commentary: ` +
    `"${q}" STOP and wait for their answer. ` +
    `Never read bracketed tags aloud. Never say the word pause.`
  );
}

export function buildWrapUpCueLeakRecoveryNudge(questionIndex = 0): string {
  const q = wrapUpQuestionAtIndex(questionIndex);
  return (
    `[wrapup-cue-leak] You leaked a hidden system tag or said pause - visitor heard gibberish. ` +
    `Apologize briefly for the hiccup, then say ONLY: "${q}" STOP and wait. ` +
    `Do not end the call. Do not read any bracketed text aloud.`
  );
}
