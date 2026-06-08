import { describe, expect, it } from "vitest";
import {
  isPlumbingVisitorEndingCall,
  shouldPlumbingClientHangup,
} from "@/lib/voice-demo-plumbing-session";

describe("voice-demo-plumbing-session", () => {
  it("does not treat casual acknowledgments as ending the call", () => {
    expect(isPlumbingVisitorEndingCall("thanks")).toBe(false);
    expect(isPlumbingVisitorEndingCall("I'm good")).toBe(false);
    expect(isPlumbingVisitorEndingCall("sounds good")).toBe(false);
    expect(isPlumbingVisitorEndingCall("okay got it")).toBe(false);
  });

  it("detects explicit call endings", () => {
    expect(isPlumbingVisitorEndingCall("bye")).toBe(true);
    expect(isPlumbingVisitorEndingCall("that's all for now, bye")).toBe(true);
    expect(isPlumbingVisitorEndingCall("I gotta go")).toBe(true);
  });

  it("only schedules plumbing hangup after visitor ends and Jarvis signs off", () => {
    expect(
      shouldPlumbingClientHangup({
        visitorEndingCall: false,
        assistantText: "Take care!",
      })
    ).toBe(false);
    expect(
      shouldPlumbingClientHangup({
        visitorEndingCall: true,
        assistantText: "Drain cleaning runs about $150 to $350.",
      })
    ).toBe(false);
    expect(
      shouldPlumbingClientHangup({
        visitorEndingCall: true,
        assistantText: "Thanks for calling Metro Plumbing. Take care!",
      })
    ).toBe(true);
  });
});
