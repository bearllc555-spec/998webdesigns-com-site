import { describe, expect, it } from "vitest";
import {
  VOICE_DEMO_CLOSING,
  VOICE_DEMO_PERSONA,
  VOICE_DEMO_WRAPUP_QUESTIONS,
  voiceDemoDemoIntroBlock,
  voiceDemoDemoSystemPrompt,
  voiceDemoVerifySystemPrompt,
} from "@/lib/voice-demo-system-prompt";
import type { VoiceDemoLeadRow } from "@/lib/voice-demo-db";
import {
  VOICE_DEMO_GOODBYE_LINE,
  VOICE_DEMO_PROMO_EMAIL_ASK_LINE,
} from "@/lib/voice-demo-constants";
import {
  VOICE_DEMO_WEATHER_OFFER_LINE,
  VOICE_DEMO_WEATHER_ZIP_ASK_LINE,
} from "@/lib/voice-demo-weather";
import { VOICE_DEMO_POST_NAME_LINE } from "@/lib/voice-demo-greeting";

describe("voice-demo-system-prompt closing", () => {
  it("pauses before wrap-up questions after answers", () => {
    expect(VOICE_DEMO_CLOSING).toMatch(/\[wrapup-ready\]/);
    expect(VOICE_DEMO_CLOSING).toMatch(/do not ask wrap-up in the same turn/i);
    expect(VOICE_DEMO_CLOSING).toMatch(/wait for the client cue/i);
  });

  it("cycles five wrap-up questions in order", () => {
    expect(VOICE_DEMO_WRAPUP_QUESTIONS[0]).toContain("anything else");
    expect(VOICE_DEMO_WRAPUP_QUESTIONS[3]).toBe("Anything else?");
    expect(VOICE_DEMO_WRAPUP_QUESTIONS[4]).toBe("Did I address all your concerns today?");
    expect(VOICE_DEMO_CLOSING).toMatch(/never "any else"/i);
    expect(VOICE_DEMO_CLOSING).toContain('Q4: "Anything else?"');
    expect(VOICE_DEMO_WRAPUP_QUESTIONS).toEqual([
      "Is there anything else I can help you with today?",
      "Do you have any other questions?",
      "Any other question?",
      "Anything else?",
      "Did I address all your concerns today?",
    ]);
    for (const q of VOICE_DEMO_WRAPUP_QUESTIONS) {
      expect(VOICE_DEMO_CLOSING).toContain(q);
    }
    expect(VOICE_DEMO_CLOSING).toMatch(/substantive 998 FAQ/i);
  });

  it("requires client-owned hangup after final sign-off", () => {
    expect(VOICE_DEMO_CLOSING).toContain("Thank you for contacting 998 web designs");
    expect(VOICE_DEMO_CLOSING).toMatch(/system disconnects|system ends the call/i);
    expect(VOICE_DEMO_CLOSING).toMatch(/client-owned/i);
  });
});

describe("voice-demo-system-prompt barge-in", () => {
  it("tells Jarvis to stop and address new input when interrupted", () => {
    expect(VOICE_DEMO_PERSONA).toMatch(/INTERRUPTIONS/i);
    expect(VOICE_DEMO_PERSONA).toMatch(/stop immediately/i);
    expect(VOICE_DEMO_PERSONA).toMatch(/one speaker at a time/i);
  });
});

describe("voice-demo-system-prompt verify", () => {
  const unverifiedRow = {
    id: "lead-1",
    primary_channel: "email",
    email: "test@example.com",
    phone: null,
    full_name: null,
    email_verified_at: null,
  } as VoiceDemoLeadRow;

  it("requires typed verification only — no spoken codes", () => {
    const prompt = voiceDemoVerifySystemPrompt(unverifiedRow);
    expect(prompt).toMatch(/TYPED ONLY/i);
    expect(prompt).toMatch(/typing field/i);
    expect(prompt).toMatch(/Do NOT ask them to read, say, or speak/i);
    expect(prompt).toMatch(/do not call verify_code from voice/i);
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
    expect(prompt).toMatch(/never twice in a row/i);
    expect(prompt).toMatch(/NEVER say "profile complete"/i);
    expect(prompt).not.toMatch(/Profile complete:/);
  });

  it("skips pleasure question when name is already on file", () => {
    const intro = voiceDemoDemoIntroBlock({
      ...baseRow,
      full_name: "Anthony",
    });
    expect(intro).toContain("Anthony");
    expect(intro).toMatch(/do not ask who you have the pleasure/i);
    expect(intro).toContain(VOICE_DEMO_POST_NAME_LINE);
  });

  it("requires permission ask before emailing coupon", () => {
    const prompt = voiceDemoDemoSystemPrompt(baseRow);
    expect(prompt).toContain(VOICE_DEMO_PROMO_EMAIL_ASK_LINE);
    expect(prompt).toMatch(/wait for yes before send_promo_email/i);
    expect(prompt).toMatch(/CLOSE QUEUE/i);
    expect(prompt).toContain("Isn't that pretty cool?");
    expect(prompt).toContain("implement into your website");
  });

  it("requires full-word price pronunciation", () => {
    const prompt = voiceDemoDemoSystemPrompt(baseRow);
    expect(prompt).toMatch(/PRICE PRONUNCIATION/i);
    expect(prompt).toContain("four hundred and ninety nine dollars");
    expect(prompt).toMatch(/never digit-by-digit/i);
    expect(prompt).toMatch(/four ninety-nine/i);
  });

  it("offers weather demo at end of chat with client-owned ZIP flow", () => {
    const prompt = voiceDemoDemoSystemPrompt(baseRow);
    expect(prompt).toContain(VOICE_DEMO_WEATHER_OFFER_LINE);
    expect(prompt).toContain(VOICE_DEMO_WEATHER_ZIP_ASK_LINE);
    expect(prompt).toMatch(/client stages ZIP/i);
    expect(prompt).toMatch(/Fahrenheit first, then Celsius/i);
    expect(prompt).toMatch(/possible location on file/i);
    expect(prompt).toContain(VOICE_DEMO_WEATHER_OFFER_LINE);
    expect(prompt).toContain(VOICE_DEMO_GOODBYE_LINE);
    expect(prompt).toMatch(/\[weather-forecast-done\]/i);
    expect(prompt).toMatch(/\[zip-staged\]/i);
    expect(prompt).toMatch(/FINAL GOODBYE/i);
  });
});
