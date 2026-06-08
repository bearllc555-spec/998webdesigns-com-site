import { describe, expect, it } from "vitest";
import {
  isPlumbingBookingReady,
  plumbingBookingMissingLabels,
} from "@/lib/voice-demo-plumbing-booking-readiness";

describe("voice-demo-plumbing-booking-readiness", () => {
  it("lists only missing fields", () => {
    expect(
      plumbingBookingMissingLabels({
        fullName: "Anthony",
        job: {
          serviceType: "Estimate",
          serviceAddress: "25 Hughes Place",
          appointmentDate: "Thursday",
          timeWindow: "Morning",
          customerEmail: null,
        },
      })
    ).toEqual(["email"]);
  });

  it("detects when booking is ready", () => {
    expect(
      isPlumbingBookingReady({
        fullName: "Anthony",
        job: {
          serviceType: "Estimate",
          serviceAddress: "25 Hughes Place",
          appointmentDate: "Thursday",
          timeWindow: "Morning",
          customerEmail: "test@example.com",
        },
      })
    ).toBe(true);
  });
});
