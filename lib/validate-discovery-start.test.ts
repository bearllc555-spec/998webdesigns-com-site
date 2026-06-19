import { describe, expect, it } from "vitest";
import { validateDiscoveryStartPayload } from "@/lib/validate-discovery-start";

describe("validateDiscoveryStartPayload", () => {
  it("requires companyName", () => {
    const result = validateDiscoveryStartPayload({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "5551234567",
      smsConsent: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/companyName/i);
    }
  });

  it("accepts valid payload with companyName", () => {
    const result = validateDiscoveryStartPayload({
      fullName: "Jane Doe",
      companyName: "Acme Plumbing",
      email: "jane@example.com",
      phone: "5551234567",
      smsConsent: true,
      goal: "New site",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.companyName).toBe("Acme Plumbing");
    }
  });
});
