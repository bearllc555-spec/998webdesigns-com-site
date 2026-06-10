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

  it("tells Jarvis to book immediately when all fields are on file", () => {
    const nudge = buildPlumbingSessionResumeNudge({
      nameOnFile: "Anthony DeMeo",
      phoneOnFile: "2015551234",
      job: {
        status: "draft",
        serviceType: "Estimate",
        serviceAddress: "25 Hughes Place",
        customerEmail: "anthony@example.com",
        appointmentDate: "Thursday",
        timeWindow: "Morning",
      },
    });
    expect(nudge).toContain("book_plumbing_appointment immediately");
    expect(nudge).toContain("Do NOT re-ask");
  });

  it("lists only missing fields after a hiccup", () => {
    const nudge = buildPlumbingSessionResumeNudge({
      nameOnFile: "Anthony",
      phoneOnFile: "2015551234",
      job: {
        status: "draft",
        serviceType: "Estimate",
        serviceAddress: "25 Hughes Place",
        appointmentDate: "Thursday",
        timeWindow: "Morning",
      },
    });
    expect(nudge).toContain("Ask ONLY for: last name, email");
    expect(nudge).toContain('real quick what\'s your name/address');
  });

  it("reminds Jarvis a callback was logged when status is callback_requested", () => {
    const nudge = buildPlumbingSessionResumeNudge({
      nameOnFile: "Anthony",
      job: { status: "callback_requested" },
    });
    expect(nudge).toContain("callback was already logged");
    expect(nudge).toContain("do not fabricate");
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
    expect(nudge).toContain("confirmation email");
  });
});
