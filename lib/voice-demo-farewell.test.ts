import { describe, expect, it } from "vitest";
import {
  canModelEndConversation,
  shouldClientScheduleFarewellHangup,
} from "@/lib/voice-demo-farewell";
import type { VoiceDemoSessionPhase } from "@/lib/voice-demo-phase";

function hangupOpts(
  overrides: Partial<{
    visitorExplicitlyDone: boolean;
    farewellSent: boolean;
    goodbyeNudgeSent: boolean;
    phase: VoiceDemoSessionPhase;
  }> = {}
) {
  return {
    visitorExplicitlyDone: false,
    farewellSent: false,
    goodbyeNudgeSent: false,
    phase: "helping" as VoiceDemoSessionPhase,
    ...overrides,
  };
}

describe("shouldClientScheduleFarewellHangup", () => {
  it("does not hang up on a substantive design-services FAQ answer", () => {
    const answer =
      "We build custom websites for local businesses. The design fee is four hundred and ninety nine dollars, " +
      "and hosting starts with thirty days free. You get mobile-friendly pages, a portfolio section, and ongoing support from 998.";
    expect(shouldClientScheduleFarewellHangup(answer, hangupOpts())).toBe(false);
  });

  it("does not hang up on FAQ answer with stray sign-off mid-call", () => {
    const answer =
      "Happy to help with that. Thank you for contacting 998 Web Designs. Have a pleasant day.";
    expect(shouldClientScheduleFarewellHangup(answer, hangupOpts())).toBe(false);
  });

  it("hangs up after farewell latched", () => {
    expect(
      shouldClientScheduleFarewellHangup(
        "Thank you for contacting 998.",
        hangupOpts({ farewellSent: true })
      )
    ).toBe(true);
  });

  it("blocks end_conversation after hidden cue leak", () => {
    expect(
      canModelEndConversation({
        farewellSent: false,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: false,
        assistantText: "pause",
        weatherDemoIncomplete: false,
      })
    ).toBe(false);
  });

  it("blocks model end_conversation always", () => {
    expect(
      canModelEndConversation({
        farewellSent: true,
        goodbyeNudgeSent: true,
        visitorExplicitlyDone: true,
        assistantText: "Thank you for contacting 998.",
        weatherDemoIncomplete: false,
      })
    ).toBe(false);
  });
});
