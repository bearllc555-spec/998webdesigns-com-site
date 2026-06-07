import { describe, expect, it } from "vitest";
import {
  VOICE_DEMO_INTRO_LINE,
  VOICE_DEMO_MANDATORY_OPENING,
  VOICE_DEMO_POST_NAME_LINE,
  VOICE_DEMO_SESSION_START_CUE,
  triggerVoiceDemoOpening,
} from "@/lib/voice-demo-greeting";

describe("voice-demo-greeting", () => {
  it("requires Jarvis intro and pleasure question", () => {
    expect(VOICE_DEMO_INTRO_LINE).toContain("Jarvis");
    expect(VOICE_DEMO_INTRO_LINE).toContain("pleasure of speaking with");
    expect(VOICE_DEMO_MANDATORY_OPENING).toContain(VOICE_DEMO_SESSION_START_CUE);
    expect(VOICE_DEMO_POST_NAME_LINE).toBe("How may I help you today?");
  });

  it("sends hidden session-start cue to the live session", () => {
    const calls: Array<{ turns: string; turnComplete: boolean }> = [];
    triggerVoiceDemoOpening({
      sendClientContent: (params) => calls.push(params),
    });
    expect(calls).toEqual([
      { turns: VOICE_DEMO_SESSION_START_CUE, turnComplete: true },
    ]);
  });
});
