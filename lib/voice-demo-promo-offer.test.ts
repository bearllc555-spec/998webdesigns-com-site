import { describe, expect, it } from "vitest";
import { VOICE_DEMO_GOODBYE_LINE, VOICE_DEMO_PROMO_EMAIL_ASK_LINE } from "@/lib/voice-demo-constants";
import { canClientScheduleHangup } from "@/lib/voice-demo-phase";
import { shouldClientScheduleFarewellHangup } from "@/lib/voice-demo-farewell";
import {
  isAssistantPromoOffer,
  isAssistantPromoOfferBundledWithGoodbye,
  isUserPromoDecline,
} from "@/lib/voice-demo-promo-offer";

describe("voice-demo-promo-offer", () => {
  it("detects the canonical coupon ask", () => {
    expect(isAssistantPromoOffer(VOICE_DEMO_PROMO_EMAIL_ASK_LINE)).toBe(true);
  });

  it("detects promo ask bundled with goodbye", () => {
    const bundled = `${VOICE_DEMO_PROMO_EMAIL_ASK_LINE} ${VOICE_DEMO_GOODBYE_LINE}`;
    expect(isAssistantPromoOfferBundledWithGoodbye(bundled)).toBe(true);
  });

  it("does not treat promo-only turn as bundled goodbye", () => {
    expect(isAssistantPromoOfferBundledWithGoodbye(VOICE_DEMO_PROMO_EMAIL_ASK_LINE)).toBe(
      false
    );
  });

  it("detects polite promo declines", () => {
    expect(isUserPromoDecline("No thanks")).toBe(true);
    expect(isUserPromoDecline("I'm good")).toBe(true);
    expect(isUserPromoDecline("Yes please")).toBe(false);
  });
});

describe("promo consent blocks client hangup", () => {
  const bundled =
    `${VOICE_DEMO_PROMO_EMAIL_ASK_LINE} Thank you for contacting 998 web designs — goodbye.`;

  it("blocks hangup while awaiting promo consent even if visitor is done", () => {
    expect(
      canClientScheduleHangup({
        phase: "final_goodbye",
        farewellSent: false,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: true,
        assistantText: bundled,
        awaitingPromoConsent: true,
      })
    ).toBe(false);
  });

  it("would hang up without awaiting promo consent flag", () => {
    expect(
      shouldClientScheduleFarewellHangup(bundled, {
        visitorExplicitlyDone: true,
        farewellSent: false,
        goodbyeNudgeSent: false,
        phase: "final_goodbye",
        awaitingPromoConsent: false,
      })
    ).toBe(true);
  });
});
