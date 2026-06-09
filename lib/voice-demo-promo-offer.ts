import { VOICE_DEMO_PROMO_EMAIL_ASK_LINE } from "@/lib/voice-demo-constants";
import {
  assistantFarewellTail,
  isAssistantExplicitGoodbye,
  isAssistantFarewellPhrase,
} from "@/lib/voice-demo-farewell";

/** Jarvis asked permission to email the VOICE20 coupon — must wait for yes/no before goodbye. */
export function isAssistantPromoOffer(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  const canonical = VOICE_DEMO_PROMO_EMAIL_ASK_LINE.toLowerCase();
  if (t.includes(canonical)) return true;
  return (
    /\bwould you like me to send you a coupon\b/i.test(t) ||
    /\bcoupon code to save 20%\b/i.test(t) ||
    /\b(save|saving)\s+20\s*%.*(design|web design)\b/i.test(t) ||
    /\b20\s*% off.*(design fee|web design package)\b/i.test(t)
  );
}

export function isAssistantPromoOfferBundledWithGoodbye(text: string): boolean {
  if (!isAssistantPromoOffer(text)) return false;
  const tail = assistantFarewellTail(text);
  return isAssistantExplicitGoodbye(tail) || isAssistantFarewellPhrase(tail);
}

/** Visitor declined the coupon offer while Jarvis is waiting for consent. */
export function isUserPromoDecline(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(no thanks|no thank you|not interested|don'?t need|no coupon|skip the coupon)\b/.test(
      t
    ) ||
    /^\s*no[.!?,]?\s*$/.test(t) ||
    (/\b(i'?m good|all set|that'?s ok|that'?s fine)\b/.test(t) && t.length < 40)
  );
}

export const VOICE_DEMO_PROMO_OFFER_WAIT_CUE = "[promo-offer-wait]";

export function buildPromoOfferWaitNudge(): string {
  return (
    `${VOICE_DEMO_PROMO_OFFER_WAIT_CUE} You asked about the coupon — STOP and wait for yes or no. ` +
    `Do not say goodbye yet. If yes → send_promo_email, then one brief sign-off in a new turn. ` +
    `If no → one brief sign-off only. Never combine the coupon question and goodbye in one turn.`
  );
}

export function buildPromoOfferSplitNudge(): string {
  return (
    `${VOICE_DEMO_PROMO_OFFER_WAIT_CUE} You bundled the coupon question with goodbye in one turn. ` +
    `Stay silent now and wait for their yes or no — do not repeat goodbye. ` +
    `If yes → send_promo_email then sign off once. If no → sign off once only.`
  );
}
