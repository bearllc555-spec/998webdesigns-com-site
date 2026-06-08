import { describe, expect, it } from "vitest";
import { buildPlumbingSessionResumeNudge } from "@/lib/voice-demo-plumbing-resume";

describe("buildPlumbingSessionResumeNudge", () => {
  it("includes mid-booking context so Jarvis continues scheduling", () => {
    const nudge = buildPlumbingSessionResumeNudge({
      nameOnFile: "Anthony",
      job: {
        status: "draft",
        serviceType: "Water heater",
        serviceAddress: "42 Oak Drive",
        customerEmail: null,
        appointmentDate: null,
        timeWindow: null,
      },
    });
    expect(nudge).toContain("[session-resume]");
    expect(nudge).toContain("Mid-booking");
    expect(nudge).toContain("Water heater");
    expect(nudge).toContain("42 Oak Drive");
    expect(nudge).toContain("replay the full opening");
  });

  it("tells Jarvis not to restart when appointment is already booked", () => {
    const nudge = buildPlumbingSessionResumeNudge({
      job: {
        status: "booked",
        serviceType: "Toilet repair",
      },
    });
    expect(nudge).toContain("already booked");
    expect(nudge).toContain("Toilet repair");
  });
});
