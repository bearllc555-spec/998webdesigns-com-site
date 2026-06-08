import { describe, expect, it } from "vitest";
import {
  canClientScheduleHangup,
  canModelEndConversation,
  deriveVoiceDemoSessionPhase,
} from "@/lib/voice-demo-phase";

const basePhaseInput = {
  postNameLineSpoken: true,
  jarvisFarewellSent: false,
  goodbyeNudgeSent: false,
  wrapUpTimerActive: false,
  farewellDisconnecting: false,
  visitorExplicitlyDone: false,
};

describe("deriveVoiceDemoSessionPhase", () => {
  it("returns onboarding before post-name greeting", () => {
    expect(
      deriveVoiceDemoSessionPhase({ ...basePhaseInput, postNameLineSpoken: false })
    ).toBe("onboarding");
  });

  it("returns helping during normal demo conversation", () => {
    expect(deriveVoiceDemoSessionPhase(basePhaseInput)).toBe("helping");
  });

  it("returns wrap_up_pending when wrap-up timer is active", () => {
    expect(
      deriveVoiceDemoSessionPhase({ ...basePhaseInput, wrapUpTimerActive: true })
    ).toBe("wrap_up_pending");
  });

  it("returns final_goodbye when goodbye nudge was sent", () => {
    expect(
      deriveVoiceDemoSessionPhase({ ...basePhaseInput, goodbyeNudgeSent: true })
    ).toBe("final_goodbye");
  });
});

describe("canClientScheduleHangup", () => {
  const serviceAnswer =
    "We build custom websites for local businesses. The design fee is five thousand nine hundred ninety eight dollars, " +
    "and hosting starts with thirty days free. Thank you for contacting 998 Web Designs.";

  it("does not hang up on FAQ answer with stray sign-off", () => {
    expect(
      canClientScheduleHangup({
        phase: "helping",
        farewellSent: false,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: false,
        assistantText: serviceAnswer,
      })
    ).toBe(false);
  });

  it("hangs up after farewell latched", () => {
    expect(
      canClientScheduleHangup({
        phase: "helping",
        farewellSent: true,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: false,
        assistantText: "Anything else?",
      })
    ).toBe(true);
  });

  it("hangs up on goodbye nudge short sign-off only", () => {
    expect(
      canClientScheduleHangup({
        phase: "final_goodbye",
        farewellSent: false,
        goodbyeNudgeSent: true,
        visitorExplicitlyDone: false,
        assistantText: "Thank you for contacting 998 Web Designs. Have a pleasant day.",
      })
    ).toBe(true);
    expect(
      canClientScheduleHangup({
        phase: "final_goodbye",
        farewellSent: false,
        goodbyeNudgeSent: true,
        visitorExplicitlyDone: false,
        assistantText: serviceAnswer,
      })
    ).toBe(false);
  });

  it("hangs up when visitor is done in final_goodbye phase", () => {
    expect(
      canClientScheduleHangup({
        phase: "final_goodbye",
        farewellSent: false,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: true,
        assistantText: "Thank you for contacting 998 Web Designs. Goodbye.",
      })
    ).toBe(true);
  });
});

describe("canModelEndConversation", () => {
  it("always blocks model end_conversation in demo", () => {
    expect(
      canModelEndConversation({
        farewellSent: true,
        goodbyeNudgeSent: true,
        visitorExplicitlyDone: true,
        assistantText: "Thank you for contacting 998.",
        demoMode: true,
      })
    ).toBe(false);
  });
});
