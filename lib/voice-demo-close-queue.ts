import {
  VOICE_DEMO_GOODBYE_LINE,
  VOICE_DEMO_PROMO_EMAIL_ASK_LINE,
  VOICE_DEMO_WEATHER_COOL_REACTION_LINE,
  VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE,
} from "@/lib/voice-demo-constants";
import { VOICE_DEMO_WRAPUP_QUESTIONS } from "@/lib/voice-demo-wrapup-nudge";

/** Post-weather scripted close — promo is last in the queue. */
export type CloseQueuePhase =
  | "idle"
  | "awaiting_cool_reaction"
  | "awaiting_implement_interest"
  | "awaiting_promo_consent"
  | "promo_sent"
  | "skipped_to_wrapup";

export const VOICE_DEMO_CLOSE_COOL_REACTION_CUE = "[close-cool-reaction]";
export const VOICE_DEMO_CLOSE_IMPLEMENT_CUE = "[close-implement-ask]";
export const VOICE_DEMO_CLOSE_PROMO_CUE = "[close-promo-ask]";
export const VOICE_DEMO_CLOSE_PROMO_DECLINED_CUE = "[close-promo-declined]";
export const VOICE_DEMO_CLOSE_SKIP_WRAPUP_CUE = "[close-skip-wrapup]";

export function isCloseQueueActive(phase: CloseQueuePhase): boolean {
  return (
    phase === "awaiting_cool_reaction" ||
    phase === "awaiting_implement_interest" ||
    phase === "awaiting_promo_consent"
  );
}

/** Promo may only be offered after forecast + implement interest (yes/maybe). */
export function shouldBlockPromoOffer(opts: {
  forecastComplete: boolean;
  closeQueuePhase: CloseQueuePhase;
}): boolean {
  if (!opts.forecastComplete) return true;
  return opts.closeQueuePhase !== "awaiting_promo_consent";
}

export function isAssistantWeatherCoolReaction(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.includes(VOICE_DEMO_WEATHER_COOL_REACTION_LINE.toLowerCase())) return true;
  return /\bisn'?t that (?:pretty )?cool\??/i.test(lower);
}

export function isAssistantImplementAsk(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.includes(VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE.toLowerCase())) return true;
  return (
    /\bimplement.{0,32}\bwebsite\b/i.test(lower) ||
    /\binto your website\b/i.test(lower)
  );
}

export function isCloseQueueAffirmative(text: string): boolean {
  return /\b(yes|yeah|yep|sure|ok|okay|absolutely|definitely|go ahead|please|i do|i would)\b/i.test(
    text.trim()
  );
}

export function isCloseQueueMaybe(text: string): boolean {
  return /\b(maybe|perhaps|could be|might|possibly|sounds good|interested)\b/i.test(
    text.trim()
  );
}

export function isCloseQueueInterest(text: string): boolean {
  return isCloseQueueAffirmative(text) || isCloseQueueMaybe(text);
}

export function isCloseQueueNegative(text: string): boolean {
  return /\b(no|nah|nope|not really|don't|do not|pass|skip|i'm good|im good|not interested)\b/i.test(
    text.trim()
  );
}

export function buildWeatherForecastCoolReactionNudge(): string {
  return (
    `${VOICE_DEMO_CLOSE_COOL_REACTION_CUE} Forecast delivered. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_COOL_REACTION_LINE}" then STOP and wait for their answer. ` +
    `No promo, no coupon, no wrap-up, no goodbye yet.`
  );
}

export function buildWeatherImplementAskNudge(): string {
  return (
    `${VOICE_DEMO_CLOSE_IMPLEMENT_CUE} Visitor liked the weather demo. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE}" then STOP and wait for yes, maybe, or no. ` +
    `No promo yet — implement interest comes before the coupon offer.`
  );
}

export function buildWeatherPromoAskNudge(): string {
  return (
    `${VOICE_DEMO_CLOSE_PROMO_CUE} Visitor is interested in implementing on their website. ` +
    `Say ONLY: "${VOICE_DEMO_PROMO_EMAIL_ASK_LINE}" then STOP and wait for yes or no. ` +
    `Only call send_promo_email after they say yes.`
  );
}

export function buildPromoDeclinedWrapUpNudge(): string {
  return (
    `${VOICE_DEMO_CLOSE_PROMO_DECLINED_CUE} Visitor declined the coupon email. ` +
    `Ask exactly: "${VOICE_DEMO_WRAPUP_QUESTIONS[0]}" then STOP and wait. ` +
    `If they say no / that's all / nothing else → say "${VOICE_DEMO_GOODBYE_LINE}" once and call end_conversation.`
  );
}

export function buildCloseQueueSkipToWrapUpNudge(reason: string): string {
  return (
    `${VOICE_DEMO_CLOSE_SKIP_WRAPUP_CUE} ${reason} ` +
    `Ask exactly: "${VOICE_DEMO_WRAPUP_QUESTIONS[0]}" then STOP and wait. ` +
    `No coupon offer this session. If they are done → goodbye and end_conversation.`
  );
}

export function buildPromoBlockedBeforeCloseQueueNudge(): string {
  return (
    `[promo-close-queue-blocked] Promo is last in the queue — not yet. ` +
    `Finish the weather close sequence first: cool reaction → implement ask → then coupon. ` +
    `Say ONLY: "${VOICE_DEMO_WEATHER_COOL_REACTION_LINE}" or the next step cue you were given — no coupon yet.`
  );
}
