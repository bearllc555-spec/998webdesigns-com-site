import { describe, expect, it } from "vitest";
import {
  PLUMBING_EMERGENCY_DISPATCH_BLOCK,
  transcriptEmergencyDispatchConfirmed,
} from "@/lib/voice-demo-plumbing-emergency";
import type { PlumbingTranscriptLine } from "@/lib/voice-demo-plumbing-transcript-book";

function lines(...entries: PlumbingTranscriptLine[]): PlumbingTranscriptLine[] {
  return entries;
}

describe("voice-demo-plumbing-emergency", () => {
  it("exports dispatch consent block for system prompt", () => {
    expect(PLUMBING_EMERGENCY_DISPATCH_BLOCK).toMatch(/emergencyDispatchConfirmed true/i);
    expect(PLUMBING_EMERGENCY_DISPATCH_BLOCK).toMatch(/\$150 dispatch fee/i);
  });

  it("rejects emergency when caller only mentions emergency without dispatch consent", () => {
    expect(
      transcriptEmergencyDispatchConfirmed(
        lines(
          { role: "user", text: "It's an emergency - burst pipe in the basement" },
          { role: "assistant", text: "If it becomes urgent, call back and say it's an emergency." }
        )
      )
    ).toBe(false);
  });

  it("accepts emergency when Jarvis offers dispatch and caller agrees", () => {
    expect(
      transcriptEmergencyDispatchConfirmed(
        lines(
          { role: "user", text: "Water is flooding the basement from a burst pipe" },
          {
            role: "assistant",
            text: "I can dispatch a tech within two hours. There is a $150 dispatch fee that applies toward repair. Do you want me to send someone out now?",
          },
          { role: "user", text: "Yes please, send someone out" }
        )
      )
    ).toBe(true);
  });

  it("rejects when dispatch offered but caller does not consent", () => {
    expect(
      transcriptEmergencyDispatchConfirmed(
        lines(
          {
            role: "assistant",
            text: "We can get an emergency tech out to you within two hours for a $150 dispatch fee.",
          },
          { role: "user", text: "Actually can we do tomorrow morning instead?" }
        )
      )
    ).toBe(false);
  });
});
