import { describe, expect, it } from "vitest";
import {
  isPlumbingBookingReady,
  plumbingBookingMissingLabels,
} from "@/lib/voice-demo-plumbing-booking-readiness";

describe("voice-demo-plumbing-booking-readiness", () => {
  it("lists last name and phone before email when first name only", () => {
    expect(
      plumbingBookingMissingLabels({
        fullName: "Anthony",
        phone: null,
        job: {
          serviceType: "Estimate",
          serviceAddress: "25 Hughes Place",
          appointmentDate: "Thursday",
          timeWindow: "Morning",
          customerEmail: null,
        },
      })
    ).toEqual(["last name", "callback phone", "email"]);
  });

  it("detects when booking is ready", () => {
    expect(
      isPlumbingBookingReady({
        fullName: "Anthony DeMeo",
        phone: "2015551234",
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

  it("accepts demo gate email on the lead when job email is unset", () => {
    expect(
      isPlumbingBookingReady({
        fullName: "Anthony DeMeo",
        phone: "2015551234",
        leadEmail: "gate@example.com",
        job: {
          serviceType: "Estimate",
          serviceAddress: "25 Hughes Place",
          appointmentDate: "Thursday",
          timeWindow: "Morning",
          customerEmail: null,
        },
      })
    ).toBe(true);
  });
});
