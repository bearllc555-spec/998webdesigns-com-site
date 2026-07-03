import { describe, expect, it } from "vitest";
import { extractedPlumbingBookingIsActionable } from "@/lib/voice-demo-plumbing-transcript-book";

describe("extractedPlumbingBookingIsActionable", () => {
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
          appointmentDate: "Thursday July 10",
          timeWindow: "Morning",
        },
        {}
      )
    ).toBe(true);
  });

  it("rejects when booking was not attempted", () => {
    expect(
      extractedPlumbingBookingIsActionable(
        {
          bookingAttempted: false,
          fullName: "Anthony Demeo",
          serviceAddress: "25 Hughes Place",
          serviceType: "Estimate",
          appointmentDate: "Thursday",
          timeWindow: "Morning",
        },
        { email: "test@example.com", phone: "9734496700" }
      )
    ).toBe(false);
  });
});
