import { describe, expect, it } from "vitest";
import {
  buildPostNameHoldNudge,
  buildSaveNameToolMessage,
  buildSessionResumeNudge,
  isAssistantPostNameGreeting,
  VOICE_DEMO_INTRO_LINE,
  VOICE_DEMO_MANDATORY_OPENING,
  VOICE_DEMO_POST_NAME_HOLD_CUE,
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

  it("detects post-name help line in assistant speech", () => {
    expect(isAssistantPostNameGreeting("Good day, Anthony. How may I help you today?")).toBe(
      true
    );
    expect(isAssistantPostNameGreeting("Who do I have the pleasure of speaking with?")).toBe(
      false
    );
  });

  it("save_name tool message stays silent when already greeted", () => {
    const silent = buildSaveNameToolMessage("Anthony", true);
    expect(silent).toMatch(/stay completely silent/i);
    const speak = buildSaveNameToolMessage("Anthony", false);
    expect(speak).toContain(VOICE_DEMO_POST_NAME_LINE);
  });

  it("builds post-name hold nudge to block repeats", () => {
    const nudge = buildPostNameHoldNudge();
    expect(nudge).toContain(VOICE_DEMO_POST_NAME_HOLD_CUE);
    expect(nudge).toMatch(/Do not repeat the greeting/i);
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
