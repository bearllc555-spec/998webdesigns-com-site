import { describe, expect, it } from "vitest";
import { buildPlumbingEmail } from "@/lib/voice-demo-plumbing-email";

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
