import { isAssistantFarewell } from "@/lib/voice-demo-farewell";

/** Fixed wrap-up question cycle — Q1→Q5, then repeat. */
export const VOICE_DEMO_WRAPUP_QUESTIONS = [
  "Is there anything else I can help you with today?",
  "Do you have any other questions?",
  "Any other question?",
  "Anything else?",
  "Did I address all your concerns today?",
] as const;

/** Hidden client cue — never spoken aloud; nudges Jarvis after a post-answer pause. */
export const VOICE_DEMO_WRAPUP_PAUSE_CUE = "[wrap-up-pause]";

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
  /coupon code via email/i,
  /something cool/i,
  /zip code/i,
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

/** Visitor pleasantry — not a product/FAQ question. */
export function isUserSmallTalk(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (SMALL_TALK_USER_PATTERNS.some((p) => p.test(t))) return true;
  if (t.length < 24 && /^(hi|hey|hello|thanks|thank you|good)\b/.test(t)) return true;
  return false;
}

/** Visitor asked about 998 services — eligible for post-answer wrap-up later. */
export function isUserSubstantiveQuestion(text: string): boolean {
  const t = text.trim();
  if (!t || isUserSmallTalk(t)) return false;
  if (SUBSTANTIVE_USER_PATTERNS.some((p) => p.test(t))) return true;
  if (/\?/.test(t) && t.length >= 10) return true;
  return false;
}

/** Assistant answered small talk only — no wrap-up yet. */
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
    weatherFlowActive: boolean;
    farewellSent: boolean;
    visitorAskedSubstantiveQuestion: boolean;
  }
): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 24) return false;
  if (opts.awaitingCollection || opts.weatherFlowActive || opts.farewellSent) return false;
  if (!opts.visitorAskedSubstantiveQuestion) return false;
  if (isAssistantWrapUpQuestion(trimmed)) return false;
  if (isAssistantFarewell(trimmed)) return false;
  if (isAssistantSmallTalkReply(trimmed)) return false;
  for (const pattern of WRAPUP_EXCLUDE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  return true;
}

export function buildWrapUpPauseNudge(): string {
  return (
    `${VOICE_DEMO_WRAPUP_PAUSE_CUE} You finished answering the visitor's substantive question. ` +
    `The comfortable pause is over — ask exactly ONE next wrap-up question from the WRAP-UP QUESTION CYCLE (advance to the next Q in order), ` +
    `then STOP and wait for their answer. Do not add another topic or question in the same turn. ` +
    `Never use wrap-up questions after small talk or name onboarding — only after a real FAQ answer.`
  );
}
