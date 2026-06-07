import { describe, expect, it } from "vitest";
import {
  VOICE_DEMO_CLOSING,
  VOICE_DEMO_WRAPUP_QUESTIONS,
} from "@/lib/voice-demo-system-prompt";

describe("voice-demo-system-prompt closing", () => {
  it("cycles four wrap-up questions in order", () => {
    expect(VOICE_DEMO_WRAPUP_QUESTIONS[0]).toContain("anything else");
    expect(VOICE_DEMO_WRAPUP_QUESTIONS[3]).toBe("Anything else?");
    expect(VOICE_DEMO_CLOSING).toMatch(/never "any else"/i);
    expect(VOICE_DEMO_CLOSING).toMatch(/Q4 exact/i);
    expect(VOICE_DEMO_WRAPUP_QUESTIONS).toEqual([
      "Is there anything else I can help you with today?",
      "Did I address all your concerns today?",
      "Any other question?",
      "Anything else?",
    ]);
    for (const q of VOICE_DEMO_WRAPUP_QUESTIONS) {
      expect(VOICE_DEMO_CLOSING).toContain(q);
    }
    expect(VOICE_DEMO_CLOSING).toMatch(/return to Q1/i);
    expect(VOICE_DEMO_CLOSING).toMatch(/STOP and wait/i);
  });

  it("requires thank-you sign-off before end_conversation", () => {
    expect(VOICE_DEMO_CLOSING).toContain("Thank you for contacting 998 web designs");
    expect(VOICE_DEMO_CLOSING).toContain("end_conversation");
  });
});
