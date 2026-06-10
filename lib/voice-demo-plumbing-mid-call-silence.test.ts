import { describe, expect, it } from "vitest";
import {
  buildPlumbingMidCallSilenceNudge,
  PLUMBING_MID_CALL_SILENCE_CUE,
} from "@/lib/voice-demo-plumbing-mid-call-silence";

describe("voice-demo-plumbing-mid-call-silence", () => {
  it("builds mid-call listen nudge", () => {
    const nudge = buildPlumbingMidCallSilenceNudge();
    expect(nudge).toMatch(PLUMBING_MID_CALL_SILENCE_CUE);
    expect(nudge).toMatch(/respond now/i);
    expect(nudge).toMatch(/Do NOT repeat your introduction/i);
  });
});
