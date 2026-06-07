import { describe, expect, it } from "vitest";
import {
  buildPostNameSpeakNudge,
  buildSessionResumeNudge,
  VOICE_DEMO_INTRO_LINE,
  VOICE_DEMO_MANDATORY_OPENING,
  VOICE_DEMO_POST_NAME_CUE,
  VOICE_DEMO_POST_NAME_LINE,
  VOICE_DEMO_SESSION_RESUME_CUE,
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

  it("builds post-name nudge with help line not how are you", () => {
    const nudge = buildPostNameSpeakNudge("Anthony");
    expect(nudge).toContain(VOICE_DEMO_POST_NAME_CUE);
    expect(nudge).toContain(VOICE_DEMO_POST_NAME_LINE);
    expect(nudge).toMatch(/Never say "how are you"/i);
  });

  it("builds session resume nudge without replaying intro", () => {
    const nudge = buildSessionResumeNudge({
      nameOnFile: "Anthony",
      nameSavedThisSession: true,
    });
    expect(nudge).toContain(VOICE_DEMO_SESSION_RESUME_CUE);
    expect(nudge).toMatch(/Do not repeat greetings/i);
  });
});
