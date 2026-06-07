import { describe, expect, it } from "vitest";
import {
  canModelEndConversation,
  shouldClientScheduleFarewellHangup,
} from "@/lib/voice-demo-farewell";

describe("shouldClientScheduleFarewellHangup", () => {
  it("does not hang up on a substantive design-services FAQ answer", () => {
    const answer =
      "We build custom websites for local businesses. The design fee is four hundred and ninety nine dollars, " +
      "and hosting starts with thirty days free. You get mobile-friendly pages, a portfolio section, and ongoing support from 998.";
    expect(shouldClientScheduleFarewellHangup(answer, false)).toBe(false);
  });

  it("hangs up when the assistant ends with the canonical sign-off", () => {
    const answer =
      "Happy to help with that. Thank you for contacting 998 Web Designs. Have a pleasant day.";
    expect(shouldClientScheduleFarewellHangup(answer, false)).toBe(true);
  });

  it("blocks end_conversation while weather demo is incomplete", () => {
    expect(
      canModelEndConversation({
        farewellSent: false,
        goodbyeNudgeSent: true,
        visitorExplicitlyDone: false,
        assistantText: "Thank you for contacting 998.",
        weatherDemoIncomplete: true,
      })
    ).toBe(false);
  });
});
