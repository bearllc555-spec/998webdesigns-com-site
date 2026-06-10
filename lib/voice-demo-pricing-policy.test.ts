import { describe, expect, it } from "vitest";
import {
  isUserPricingQuestion,
  PRICING_WHEN_ASKED_RULES,
  stripFaqPrices,
} from "@/lib/voice-demo-pricing-policy";
import { voiceDemoDemoSystemPrompt } from "@/lib/voice-demo-system-prompt";
import type { VoiceDemoLeadRow } from "@/lib/voice-demo-db";

describe("voice-demo-pricing-policy", () => {
  it("detects explicit pricing questions", () => {
    expect(isUserPricingQuestion("How much does a website cost?")).toBe(true);
    expect(isUserPricingQuestion("What is your pricing?")).toBe(true);
    expect(isUserPricingQuestion("What's included for five thousand?")).toBe(true);
    expect(isUserPricingQuestion("Who owns the site?")).toBe(false);
    expect(isUserPricingQuestion("How fast is hosting?")).toBe(false);
  });

  it("strips dollar amounts from FAQ copy", () => {
    expect(stripFaqPrices("Design fee is $5,998 with $98/mo hosting.")).toBe(
      "Design fee is with hosting."
    );
    expect(stripFaqPrices("What's included for $5,998?")).toBe("What's included?");
  });

  it("requires feature-first answers in demo prompt", () => {
    const prompt = voiceDemoDemoSystemPrompt({
      id: "lead-1",
      primary_channel: "email",
      email: "test@example.com",
      phone: null,
      full_name: "Anthony",
      email_verified_at: "2026-06-07T00:00:00.000Z",
    } as VoiceDemoLeadRow);
    expect(prompt).toContain(PRICING_WHEN_ASKED_RULES);
    expect(prompt).toMatch(/do not volunteer/i);
    expect(prompt).toMatch(/FAQ FEATURES/i);
    expect(prompt).toMatch(/FAQ PRICING DETAIL/i);
    expect(prompt).toMatch(/only when visitor explicitly asks/i);
    expect(prompt).toMatch(/Lead with features/i);
  });
});
