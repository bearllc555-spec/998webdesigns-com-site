import { describe, expect, it } from "vitest";
import {
  extractedPlumbingBookingIsActionable,
  heuristicPlumbingFieldsFromTranscript,
  mergePlumbingExtraction,
  transcriptIndicatesBookingConfirmed,
} from "@/lib/voice-demo-plumbing-transcript-book";

describe("voice-demo-plumbing-transcript-book", () => {
  it("detects Jarvis booking confirmation language", () => {
    expect(
      transcriptIndicatesBookingConfirmed([
        { role: "assistant", text: "Your confirmation email with the coupon is on the way." },
      ])
    ).toBe(true);
  });

  it("heuristically extracts address, service, and schedule", () => {
    const heuristics = heuristicPlumbingFieldsFromTranscript([
      { role: "user", text: "I need a water heater estimate at 25 Hughes Place" },
      { role: "assistant", text: "Thursday morning works - confirmation email is on the way." },
    ]);
    expect(heuristics.serviceType).toBe("Water heater service");
    expect(heuristics.serviceAddress).toMatch(/25 Hughes Place/i);
    expect(heuristics.appointmentDate).toBe("Thursday");
    expect(heuristics.timeWindow).toBe("Morning");
    expect(heuristics.bookingAttempted).toBe(true);
  });

  it("accepts a complete standard booking extraction", () => {
    expect(
      extractedPlumbingBookingIsActionable(
        {
          bookingAttempted: true,
          fullName: "Anthony Demeo",
          email: "test@example.com",
          phone: "9734496700",
          serviceAddress: "25 Hughes Place, Little Falls NJ",
          serviceType: "Water heater estimate",
          appointmentDate: "Thursday",
          timeWindow: "Morning",
        },
        {}
      )
    ).toBe(true);
  });

  it("merges gemini, heuristics, and lead on file", () => {
    const merged = mergePlumbingExtraction(
      {
        bookingAttempted: false,
        fullName: null,
        email: null,
        phone: null,
        serviceAddress: null,
        serviceType: "Drain cleaning",
        appointmentDate: null,
        timeWindow: null,
      },
      heuristicPlumbingFieldsFromTranscript([
        { role: "user", text: "25 Oak Drive" },
        { role: "assistant", text: "You're all set - confirmation text is on the way." },
      ]),
      { email: "test@example.com", fullName: "Dave Demeo", phone: "9734496700" },
      [{ role: "assistant", text: "You're all set - confirmation text is on the way." }]
    );
    expect(merged.bookingAttempted).toBe(true);
    expect(merged.email).toBe("test@example.com");
    expect(merged.serviceType).toBe("Drain cleaning");
  });

  it("does not flag emergency when only Jarvis mentions emergency service in FAQ", () => {
    const transcript = [
      { role: "user" as const, text: "I need a water heater estimate Thursday morning" },
      {
        role: "assistant" as const,
        text: "You're all set. If it becomes urgent, call back and say it's an emergency.",
      },
    ];
    expect(heuristicPlumbingFieldsFromTranscript(transcript).isEmergency).toBe(false);
    const merged = mergePlumbingExtraction(
      {
        bookingAttempted: true,
        isEmergency: true,
        fullName: "Dave Demeo",
        email: "test@example.com",
        phone: "9734496700",
        serviceAddress: "25 Hughes Place",
        serviceType: "Water heater estimate",
        appointmentDate: "Thursday",
        timeWindow: "Morning",
      },
      heuristicPlumbingFieldsFromTranscript(transcript),
      { email: "test@example.com", fullName: "Dave Demeo", phone: "9734496700" },
      transcript
    );
    expect(merged.isEmergency).not.toBe(true);
  });

  it("flags emergency only after dispatch offer and caller consent", () => {
    const transcript = [
      { role: "user" as const, text: "Burst pipe - water everywhere" },
      {
        role: "assistant" as const,
        text: "I can dispatch a tech within two hours. The $150 dispatch fee applies toward repair. Do you want me to send someone out now?",
      },
      { role: "user" as const, text: "Yes please" },
    ];
    expect(heuristicPlumbingFieldsFromTranscript(transcript).isEmergency).toBe(true);
  });
});
