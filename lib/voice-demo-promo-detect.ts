import { VOICE_DEMO_PROMO_EMAIL_ASK_LINE } from "@/lib/voice-demo-constants";

/** Jarvis asked permission to email the coupon (or mentioned VOICE20 / discount). */
export function isAssistantPromoAsk(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.includes(VOICE_DEMO_PROMO_EMAIL_ASK_LINE.toLowerCase())) return true;
  return (
    /send you a coupon/i.test(lower) ||
    /coupon code.{0,40}(email|save|20\s*%)/i.test(lower) ||
    /save 20\s*% off/i.test(lower) ||
    /email you a coupon/i.test(lower) ||
    /mind if i (send|email)/i.test(lower) ||
    /\bvoice\s*20\b/i.test(lower) ||
    /\b20\s*% off/i.test(lower) ||
    /\bdiscount code\b/i.test(lower) ||
    (/\bcoupon\b/.test(lower) && /\b(email|send)\b/.test(lower))
  );
}
