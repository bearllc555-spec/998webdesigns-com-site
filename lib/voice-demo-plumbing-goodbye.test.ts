import { describe, expect, it } from "vitest";
import {
  buildPlumbingGoodbyeBeatNudge,
  PLUMBING_GOODBYE_BEAT_CUE,
  PLUMBING_GOODBYE_BEAT_MS,
} from "@/lib/voice-demo-plumbing-goodbye";

describe("voice-demo-plumbing-goodbye", () => {
  it("uses a natural beat delay", () => {
    expect(PLUMBING_GOODBYE_BEAT_MS).toBeGreaterThanOrEqual(1_500);
  });

  it("nudge cues unhurried sign-off", () => {
    const nudge = buildPlumbingGoodbyeBeatNudge();
    expect(nudge).toContain(PLUMBING_GOODBYE_BEAT_CUE);
    expect(nudge).toMatch(/warm sign-off/i);
    expect(nudge).toMatch(/not rushed|not echo/i);
  });
});
