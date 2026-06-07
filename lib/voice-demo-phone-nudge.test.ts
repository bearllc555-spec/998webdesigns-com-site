import { describe, expect, it } from "vitest";
import {
  buildPhonePauseNudge,
  countSpokenPhoneDigits,
  VOICE_DEMO_PHONE_PAUSE_CUE,
} from "@/lib/voice-demo-phone-nudge";

describe("voice-demo-phone-nudge", () => {
  it("counts digits in spoken phone transcript", () => {
    expect(countSpokenPhoneDigits("two zero one five five five one two three four")).toBe(0);
    expect(countSpokenPhoneDigits("201 555 1234")).toBe(10);
    expect(countSpokenPhoneDigits("201-555-12")).toBe(8);
  });

  it("nudges stage_phone_number when ten or more digits heard", () => {
    const nudge = buildPhonePauseNudge("201 555 1234");
    expect(nudge).toContain(VOICE_DEMO_PHONE_PAUSE_CUE);
    expect(nudge).toContain("stage_phone_number");
  });

  it("nudges repeat when fewer than ten digits heard", () => {
    const nudge = buildPhonePauseNudge("201 555 12");
    expect(nudge).toContain("did not catch the full ten-digit");
  });

  it("nudges gentle re-ask when no digits in transcript", () => {
    const nudge = buildPhonePauseNudge("um hello");
    expect(nudge).toContain("ask for their US cell");
  });
});
