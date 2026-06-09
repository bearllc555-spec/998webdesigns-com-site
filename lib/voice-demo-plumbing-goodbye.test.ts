import { describe, expect, it } from "vitest";
import {
  buildPlumbingExitConcernsNudge,
  buildPlumbingFinalGoodbyeNudge,
  PLUMBING_EXIT_CONCERNS_CUE,
  PLUMBING_EXIT_CONCERNS_QUESTION,
  PLUMBING_FINAL_GOODBYE_CUE,
  PLUMBING_GOODBYE_BEAT_MS,
} from "@/lib/voice-demo-plumbing-goodbye";

describe("voice-demo-plumbing-goodbye", () => {
  it("uses a natural beat delay", () => {
    expect(PLUMBING_GOODBYE_BEAT_MS).toBeGreaterThanOrEqual(1_500);
  });

  it("exit concerns nudge uses exact question", () => {
    const nudge = buildPlumbingExitConcernsNudge();
    expect(nudge).toContain(PLUMBING_EXIT_CONCERNS_CUE);
    expect(nudge).toContain(PLUMBING_EXIT_CONCERNS_QUESTION);
    expect(nudge).toMatch(/Say ONLY this exact question/i);
  });

  it("final goodbye nudge cues unhurried sign-off", () => {
    const nudge = buildPlumbingFinalGoodbyeNudge();
    expect(nudge).toContain(PLUMBING_FINAL_GOODBYE_CUE);
    expect(nudge).toMatch(/Metro Plumbing/i);
    expect(nudge).toMatch(/not rushed|final line/i);
  });
});
