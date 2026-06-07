import { describe, expect, it } from "vitest";
import {
  VOICE_DEMO_CLOSING,
  VOICE_DEMO_WRAPUP_QUESTIONS,
  voiceDemoDemoSystemPrompt,
} from "@/lib/voice-demo-system-prompt";
import type { VoiceDemoLeadRow } from "@/lib/voice-demo-db";
import { VOICE_DEMO_PROMO_EMAIL_ASK_LINE } from "@/lib/voice-demo-constants";
import { VOICE_DEMO_WEATHER_OFFER_LINE } from "@/lib/voice-demo-weather";
import { VOICE_DEMO_POST_NAME_LINE } from "@/lib/voice-demo-greeting";

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

describe("voice-demo-system-prompt onboarding", () => {
  const baseRow = {
    id: "lead-1",
    primary_channel: "email",
    email: "test@example.com",
    phone: null,
    full_name: null,
    email_verified_at: "2026-06-07T00:00:00.000Z",
  } as VoiceDemoLeadRow;

  it("asks how may I help after name and forbids profile complete aloud", () => {
    const prompt = voiceDemoDemoSystemPrompt(baseRow);
    expect(prompt).toContain(VOICE_DEMO_POST_NAME_LINE);
    expect(prompt).toMatch(/NEVER say "profile complete"/i);
    expect(prompt).not.toMatch(/Profile complete:/);
  });

  it("requires permission ask before emailing coupon", () => {
    const prompt = voiceDemoDemoSystemPrompt(baseRow);
    expect(prompt).toContain(VOICE_DEMO_PROMO_EMAIL_ASK_LINE);
    expect(prompt).toMatch(/never call send_promo_email without asking first/i);
    expect(prompt).toMatch(/STOP and wait/i);
  });

  it("offers weather demo at end of chat before goodbye", () => {
    const prompt = voiceDemoDemoSystemPrompt(baseRow);
    expect(prompt).toContain(VOICE_DEMO_WEATHER_OFFER_LINE);
    expect(VOICE_DEMO_WEATHER_OFFER_LINE).toContain("Before you go");
    expect(prompt).toMatch(/end of chat/i);
    expect(prompt).toMatch(/FINAL GOODBYE/i);
  });
});
