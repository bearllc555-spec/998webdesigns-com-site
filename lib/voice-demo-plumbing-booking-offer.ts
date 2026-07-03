import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_PROMO_AMOUNT,
} from "@/lib/voice-demo-plumbing-constants";

/** Coupon hook - say when first offering to book (before intake). */
export const PLUMBING_BOOKING_OFFER_COUPON_LINE = `If you book an appointment with me right now, I'll send you a $${PLUMBING_DEMO_PROMO_AMOUNT} coupon off any service with ${PLUMBING_DEMO_BUSINESS_NAME}.`;

export const PLUMBING_BOOKING_OFFER_BLOCK = `BOOKING OFFER (critical - only when inviting them to schedule, NOT while asking diagnostic questions):
- Use this ONLY on the turn where you explicitly invite scheduling - "want me to get you on the schedule", "I can book that for you", "would you like an appointment", or similar - AFTER you understand their problem (see LISTEN FIRST).
- Do NOT use BOOKING OFFER in the same turn as any question you are waiting for them to answer.
- The FIRST scheduling invite in the call should mention the $${PLUMBING_DEMO_PROMO_AMOUNT} coupon in that same turn, BEFORE collecting name, address, phone, or email.
- Say naturally: "${PLUMBING_BOOKING_OFFER_COUPON_LINE}" then ask if they'd like to book (or begin intake if they already said yes).
- After they agree, follow BOOKING CONTACT ORDER - do not repeat the coupon pitch on every field; the confirmation email includes their unique code (never read the code aloud on the call).
- Do NOT save the coupon mention for price hesitation or the end of intake - lead with it at the booking invite. You may mention it again only if they hesitate on price.`;