import { describe, expect, it } from "vitest";
import {
  buildPlumbingEmail,
  formatPlumbingAppointmentDateForEmail,
} from "@/lib/voice-demo-plumbing-email";

describe("buildPlumbingEmail", () => {
  it("builds appointment confirmation", () => {
    const { subject, html } = buildPlumbingEmail("appointment", {
      to: "test@example.com",
      firstName: "Alex",
      serviceType: "Drain cleaning",
      appointmentDate: "Tuesday",
      timeWindow: "Morning",
      serviceAddress: "123 Main St",
      priceRange: "$150–$250",
      promoApplied: true,
    });
    expect(subject).toContain("Confirmed");
    expect(html).toContain("Alex");
    expect(html).toContain("Drain cleaning");
    expect(html).toContain("$50 discount");
  });

  it("formats ISO appointment dates for customers", () => {
    expect(formatPlumbingAppointmentDateForEmail("2026-06-10")).toBe(
      "Wednesday, June 10, 2026"
    );
    expect(formatPlumbingAppointmentDateForEmail("Wednesday morning")).toBe(
      "Wednesday morning"
    );
    const { html } = buildPlumbingEmail("appointment", {
      to: "test@example.com",
      firstName: "Anthony",
      serviceType: "Water Heater Replacement",
      appointmentDate: "2026-06-10",
      timeWindow: "Morning",
      serviceAddress: "25 Hughes Place, Little Falls, NJ",
    });
    expect(html).toContain("Wednesday, June 10, 2026");
    expect(html).not.toContain("2026-06-10");
  });

  it("builds standalone $50 promo email", () => {
    const { subject, html } = buildPlumbingEmail("promo", {
      to: "test@example.com",
      firstName: "Anthony",
      serviceType: "Water Heater Replacement",
    });
    expect(subject).toContain("$50");
    expect(html).toContain("Anthony");
    expect(html).toContain("Water Heater Replacement");
  });

  it("builds emergency dispatch email", () => {
    const { subject, html } = buildPlumbingEmail("emergency", {
      to: "test@example.com",
      firstName: "Sam",
      serviceAddress: "9 Oak Ave",
      issueDescription: "Burst pipe",
    });
    expect(subject).toContain("Emergency");
    expect(html).toContain("shut off");
    expect(html).toContain("Burst pipe");
  });
});
