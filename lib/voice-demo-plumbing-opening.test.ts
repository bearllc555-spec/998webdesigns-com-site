import { describe, expect, it } from "vitest";
import { isAssistantOnboardingOrHelpSpeech } from "@/lib/voice-demo-farewell";
import { PLUMBING_DEMO_OPENING_LINE } from "@/lib/voice-demo-plumbing-constants";
import {
  buildPlumbingPostOpeningListenNudge,
  isPlumbingOpeningLine,
} from "@/lib/voice-demo-plumbing-opening";

describe("voice-demo-plumbing-opening", () => {
  it("detects the mandatory opening line", () => {
    expect(isPlumbingOpeningLine(PLUMBING_DEMO_OPENING_LINE)).toBe(true);
    expect(isAssistantOnboardingOrHelpSpeech(PLUMBING_DEMO_OPENING_LINE)).toBe(true);
  });

  it("builds post-opening listen nudge", () => {
    const nudge = buildPlumbingPostOpeningListenNudge();
    expect(nudge).toMatch(/\[plumbing-post-opening\]/);
    expect(nudge).toMatch(/respond now/i);
    expect(nudge).toMatch(/Do NOT repeat the opening/i);
  });
});
