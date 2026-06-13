import { describe, expect, it } from "vitest";
import { normalizeVerificationCode } from "@/lib/voice-demo-code";
import { codesMatch, hashVerificationCode } from "@/lib/voice-demo-otp";
import {
  buildEmailVoiceReadBack,
  pronounceEmailDomainForVoice,
  pronounceEmailForVoice,
  spellEmailForVoice,
  spellEmailLocalPartForVoice,
} from "@/lib/voice-demo-spell-email";
import { spellPhoneForVoice } from "@/lib/voice-demo-spell-phone";
import {
  buildFarewellHoldNudge,
  canModelEndConversation,
  isAssistantExplicitGoodbye,
  isAssistantFarewell,
  isUserExplicitlyDone,
  isUserFarewellEcho,
  shouldClientScheduleFarewellHangup,
  VOICE_DEMO_FAREWELL_HOLD_CUE,
} from "@/lib/voice-demo-farewell";

describe("voice demo verification code", () => {
  it("normalizes spoken digits", () => {
    expect(normalizeVerificationCode("4 7 9 8 2 1")).toBe("479821");
    expect(normalizeVerificationCode("four seven nine eight two one")).toBe("479821");
  });

  it("spells email local part for voice read-back", () => {
    expect(spellEmailForVoice("ademeo@gmail.com")).toBe("a d e m e o @gmail.com");
    expect(spellEmailForVoice("bear@gmail.com")).toBe("b e a r @gmail.com");
  });

  it("pronounces email in three steps for plumbing read-back", () => {
    expect(pronounceEmailForVoice("ademeo@gmail.com")).toBe("ademeo at gmail dot com");
    expect(spellEmailLocalPartForVoice("ademeo@gmail.com")).toBe("a d e m e o");
    expect(pronounceEmailDomainForVoice("ademeo@gmail.com")).toBe("at gmail dot com");
    expect(pronounceEmailDomainForVoice("joe@abcplumbing.com")).toBe(
      "at abcplumbing dot com"
    );
    expect(buildEmailVoiceReadBack("ademeo@gmail.com")).toEqual({
      pronounce: "ademeo at gmail dot com",
      localSpelled: "a d e m e o",
      domainSpoken: "at gmail dot com",
    });
  });

  it("spells phone digits for voice read-back", () => {
    expect(spellPhoneForVoice("+12015551234")).toBe("2 0 1 5 5 5 1 2 3 4");
  });

  it("matches hashed email OTP", () => {
    const code = "123456";
    const hash = hashVerificationCode(code);
    expect(codesMatch(hash, "123456")).toBe(true);
    expect(codesMatch(hash, "123457")).toBe(false);
  });
});

describe("voice demo farewell", () => {
  it("detects user goodbye echo", () => {
    expect(isUserFarewellEcho("Goodbye, thanks!")).toBe(true);
    expect(isUserFarewellEcho("What is hosting?")).toBe(false);
  });

  it("builds farewell hold nudge to stop goodbye loops", () => {
    const nudge = buildFarewellHoldNudge();
    expect(nudge).toContain(VOICE_DEMO_FAREWELL_HOLD_CUE);
    expect(nudge).toMatch(/Stay completely silent/i);
    expect(nudge).toMatch(/do not say "thank you for contacting" again/i);
  });

  it("detects assistant sign-off", () => {
    expect(isAssistantFarewell("Have a pleasant day, sir.")).toBe(true);
    expect(
      isAssistantFarewell("Thank you for contacting 998 web designs - goodbye.")
    ).toBe(true);
    expect(isAssistantFarewell("Hosting is $98 per month.")).toBe(false);
    expect(
      isAssistantFarewell("Good day, Anthony. How may I help you today?")
    ).toBe(false);
    expect(isAssistantFarewell("We take care of hosting, SSL, and updates.")).toBe(false);
    expect(isAssistantFarewell("I'll take care of that for you, sir.")).toBe(false);
    expect(isAssistantFarewell("Take care, sir - goodbye.")).toBe(true);
    expect(
      isAssistantFarewell(
        "We build custom websites for local businesses, sir - mobile-friendly pages, hosting included. It is my pleasure assisting you with your website design needs."
      )
    ).toBe(false);
    expect(
      isAssistantExplicitGoodbye("Thank you for contacting 998 web designs - goodbye.")
    ).toBe(true);
    const hangupOpts = (overrides: Record<string, unknown> = {}) => ({
      visitorExplicitlyDone: false,
      farewellSent: false,
      goodbyeNudgeSent: false,
      phase: "helping" as const,
      ...overrides,
    });
    expect(
      shouldClientScheduleFarewellHangup("Have a pleasant day, sir.", hangupOpts())
    ).toBe(false);
    expect(
      shouldClientScheduleFarewellHangup(
        "Have a pleasant day, sir.",
        hangupOpts({ visitorExplicitlyDone: true, phase: "final_goodbye" })
      )
    ).toBe(true);
    const serviceAnswer =
      "We build custom websites for local businesses, sir - mobile-friendly pages, hosting included, and a clear design timeline. Our design fee covers strategy, copy, and launch on 998 hosting.";
    expect(
      shouldClientScheduleFarewellHangup(
        serviceAnswer,
        hangupOpts({ visitorExplicitlyDone: true, phase: "final_goodbye" })
      )
    ).toBe(false);
    expect(shouldClientScheduleFarewellHangup(serviceAnswer, hangupOpts())).toBe(false);
    expect(
      canModelEndConversation({
        farewellSent: false,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: true,
        assistantText: serviceAnswer,
      })
    ).toBe(false);
  });

  it("detects explicit visitor done", () => {
    expect(isUserExplicitlyDone("That's all, thanks.")).toBe(true);
    expect(isUserExplicitlyDone("What is hosting?")).toBe(false);
  });

  it("blocks model end_conversation - client owns hangup", () => {
    expect(
      canModelEndConversation({
        farewellSent: false,
        goodbyeNudgeSent: false,
        visitorExplicitlyDone: false,
        assistantText: "How may I help you today?",
      })
    ).toBe(false);
    expect(
      canModelEndConversation({
        farewellSent: true,
        goodbyeNudgeSent: true,
        visitorExplicitlyDone: true,
        assistantText: "Thank you for contacting 998 web designs - goodbye.",
      })
    ).toBe(false);
  });
});
