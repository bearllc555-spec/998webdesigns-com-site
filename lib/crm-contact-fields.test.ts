import { describe, expect, it } from "vitest";
import {
  assemblePlumbingServiceAddress,
  crmContactFromPlumbingJob,
  displayCrmContactValue,
} from "@/lib/crm-contact-fields";

describe("crm-contact-fields", () => {
  it("shows em dash for blank values", () => {
    expect(displayCrmContactValue(null)).toBe("-");
    expect(displayCrmContactValue("  ")).toBe("-");
    expect(displayCrmContactValue("973-555-0142")).toBe("973-555-0142");
  });

  it("assembles structured address", () => {
    expect(
      assemblePlumbingServiceAddress({
        street: "42 Oak Street",
        line2: "Apt 2",
        city: "Ridgewood",
        state: "NJ",
        zip: "07450",
      })
    ).toBe("42 Oak Street, Apt 2, Ridgewood, NJ 07450");
  });

  it("maps plumbing job with progressive fields", () => {
    const early = crmContactFromPlumbingJob("(551) 555-4401", null);
    expect(early.cellPhone).toBe("(551) 555-4401");
    expect(early.street).toBeNull();

    const booked = crmContactFromPlumbingJob("(201) 555-2290", {
      service_street: "42 Oak Street",
      service_city: "Ridgewood",
      service_state: "NJ",
      service_zip: "07450",
      service_address: "42 Oak Street, Ridgewood, NJ 07450",
    });
    expect(booked.street).toBe("42 Oak Street");
    expect(booked.city).toBe("Ridgewood");
  });
});
