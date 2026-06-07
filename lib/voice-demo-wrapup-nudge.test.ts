import { describe, expect, it } from "vitest";
import {
  buildWrapUpPauseNudge,
  isAssistantSmallTalkReply,
  isAssistantWrapUpQuestion,
  isUserSmallTalk,
  isUserSubstantiveQuestion,
  shouldScheduleWrapUpAfterAnswer,
  VOICE_DEMO_WRAPUP_PAUSE_CUE,
  WRAPUP_POST_ANSWER_PAUSE_MS,
} from "@/lib/voice-demo-wrapup-nudge";
import { VOICE_DEMO_WRAPUP_QUESTIONS } from "@/lib/voice-demo-wrapup-nudge";

describe("voice-demo-wrapup-nudge", () => {
  it("uses a four-second post-answer pause", () => {
    expect(WRAPUP_POST_ANSWER_PAUSE_MS).toBe(4000);
  });

  it("detects visitor small talk vs substantive questions", () => {
    expect(isUserSmallTalk("How are you doing today?")).toBe(true);
    expect(isUserSubstantiveQuestion("How are you doing today?")).toBe(false);
    expect(isUserSubstantiveQuestion("How much does the design fee cost?")).toBe(true);
  });

  it("does not schedule wrap-up after small-talk replies", () => {
    expect(
      isAssistantSmallTalkReply("I'm doing quite well, thank you for asking.")
    ).toBe(true);
    expect(
      shouldScheduleWrapUpAfterAnswer(
        "I'm doing quite well, thank you for asking.",
        {
          awaitingCollection: false,
          weatherFlowActive: false,
          farewellSent: false,
          visitorAskedSubstantiveQuestion: true,
        }
      )
    ).toBe(false);
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
        weatherFlowActive: false,
        farewellSent: false,
        visitorAskedSubstantiveQuestion: true,
      })
    ).toBe(true);
    expect(
      shouldScheduleWrapUpAfterAnswer(answer, {
        awaitingCollection: false,
        weatherFlowActive: false,
        farewellSent: false,
        visitorAskedSubstantiveQuestion: false,
      })
    ).toBe(false);
    expect(
      shouldScheduleWrapUpAfterAnswer("How may I help you today?", {
        awaitingCollection: false,
        weatherFlowActive: false,
        farewellSent: false,
        visitorAskedSubstantiveQuestion: true,
      })
    ).toBe(false);
    expect(
      shouldScheduleWrapUpAfterAnswer(answer, {
        awaitingCollection: true,
        weatherFlowActive: false,
        farewellSent: false,
        visitorAskedSubstantiveQuestion: true,
      })
    ).toBe(false);
    expect(
      shouldScheduleWrapUpAfterAnswer(answer, {
        awaitingCollection: false,
        weatherFlowActive: true,
        farewellSent: false,
        visitorAskedSubstantiveQuestion: true,
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
