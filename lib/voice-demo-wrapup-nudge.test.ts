import { describe, expect, it } from "vitest";
import {
  buildWrapUpPauseNudge,
  isAssistantWrapUpQuestion,
  shouldScheduleWrapUpAfterAnswer,
  VOICE_DEMO_WRAPUP_PAUSE_CUE,
  WRAPUP_POST_ANSWER_PAUSE_MS,
} from "@/lib/voice-demo-wrapup-nudge";
import { VOICE_DEMO_WRAPUP_QUESTIONS } from "@/lib/voice-demo-wrapup-nudge";

describe("voice-demo-wrapup-nudge", () => {
  it("uses a few-second post-answer pause", () => {
    expect(WRAPUP_POST_ANSWER_PAUSE_MS).toBe(3000);
  });

  it("detects wrap-up questions from the cycle", () => {
    for (const q of VOICE_DEMO_WRAPUP_QUESTIONS) {
      expect(isAssistantWrapUpQuestion(q)).toBe(true);
    }
    expect(isAssistantWrapUpQuestion("Our hosting is $198 per month after trial.")).toBe(
      false
    );
  });

  it("schedules after substantive answers only", () => {
    const answer =
      "The design fee is five thousand nine hundred ninety-eight dollars, sir, with hosting options after that.";
    expect(
      shouldScheduleWrapUpAfterAnswer(answer, {
        awaitingCollection: false,
        farewellSent: false,
      })
    ).toBe(true);
    expect(
      shouldScheduleWrapUpAfterAnswer("How may I help you today?", {
        awaitingCollection: false,
        farewellSent: false,
      })
    ).toBe(false);
    expect(
      shouldScheduleWrapUpAfterAnswer(answer, {
        awaitingCollection: true,
        farewellSent: false,
      })
    ).toBe(false);
  });

  it("nudges one wrap-up question after the pause cue", () => {
    const nudge = buildWrapUpPauseNudge();
    expect(nudge).toContain(VOICE_DEMO_WRAPUP_PAUSE_CUE);
    expect(nudge).toMatch(/WRAP-UP QUESTION CYCLE/i);
    expect(nudge).toMatch(/STOP and wait/i);
  });
});
