import { describe, expect, it } from "vitest";
import {
  isPlumbingBookingContinuation,
  isPlumbingVisitorEndingCall,
  shouldPlumbingClientHangup,
} from "@/lib/voice-demo-plumbing-session";

describe("voice-demo-plumbing-session", () => {
  it("does not treat casual acknowledgments as ending the call", () => {
    expect(isPlumbingVisitorEndingCall("thanks")).toBe(false);
    expect(isPlumbingVisitorEndingCall("I'm good")).toBe(false);
    expect(isPlumbingVisitorEndingCall("sounds good")).toBe(false);
    expect(isPlumbingVisitorEndingCall("okay got it")).toBe(false);
    expect(isPlumbingVisitorEndingCall("no, nothing else")).toBe(false);
    expect(isPlumbingVisitorEndingCall("we're done with the toilet")).toBe(false);
  });

  it("detects explicit call endings", () => {
    expect(isPlumbingVisitorEndingCall("bye")).toBe(true);
    expect(isPlumbingVisitorEndingCall("that's all for now, bye")).toBe(true);
    expect(isPlumbingVisitorEndingCall("I gotta go")).toBe(true);
    expect(isPlumbingVisitorEndingCall("that's all for now")).toBe(true);
  });

  it("detects booking continuation speech", () => {
    expect(isPlumbingBookingContinuation("123 Main Street")).toBe(true);
    expect(isPlumbingBookingContinuation("Thursday morning works")).toBe(true);
    expect(isPlumbingBookingContinuation("bearllc555@gmail.com")).toBe(true);
    expect(isPlumbingBookingContinuation("yes that's right")).toBe(true);
    expect(isPlumbingBookingContinuation("42 Oak Drive")).toBe(true);
    expect(isPlumbingBookingContinuation("bye")).toBe(false);
  });

  it("never auto-hangups plumbing sessions", () => {
    expect(
      shouldPlumbingClientHangup({
        visitorEndingCall: false,
        assistantText: "Take care!",
      })
    ).toBe(false);
    expect(
      shouldPlumbingClientHangup({
        visitorEndingCall: true,
        assistantText: "Thanks for calling Metro Plumbing. Take care!",
      })
    ).toBe(false);
  });
});
