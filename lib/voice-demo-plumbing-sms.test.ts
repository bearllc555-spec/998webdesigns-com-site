import { describe, expect, it } from "vitest";
import {
  buildPlumbingAfterHoursSms,
  buildPlumbingConfirmationSms,
  buildPlumbingEmergencySms,
} from "@/lib/voice-demo-plumbing-sms";
import { withSmsComplianceFooter } from "@/lib/twilio-sms";

describe("voice-demo-plumbing-sms", () => {
  it("builds standard appointment confirmation", () => {
    const body = buildPlumbingConfirmationSms(
      "Alex",
      "Water heater replacement",
      "2026-06-10",
      "Morning",
      "123 Main St, Little Falls NJ",
      true
    );
    expect(body).toContain("Alex");
    expect(body).toContain("Water heater replacement");
    expect(body).toContain("Wednesday, June 10, 2026");
    expect(body).toContain("$50 coupon");
  });

  it("builds emergency dispatch SMS", () => {
    const body = buildPlumbingEmergencySms("Sam", "45 Oak Ave", "burst pipe");
    expect(body).toContain("emergency dispatch");
    expect(body).toContain("burst pipe");
    expect(body).toContain("45 Oak Ave");
  });

  it("builds after-hours SMS", () => {
    expect(buildPlumbingAfterHoursSms("Jordan")).toContain("after hours");
  });
});

describe("withSmsComplianceFooter", () => {
  it("appends A2P footer when missing", () => {
    expect(withSmsComplianceFooter("Hello")).toContain("STOP to cancel");
  });

  it("does not double-append footer", () => {
    const withFooter = "Hi - Reply HELP for help, STOP to cancel.";
    expect(withSmsComplianceFooter(withFooter)).toBe(withFooter);
  });
});
