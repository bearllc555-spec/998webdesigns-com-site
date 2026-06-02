import { describe, expect, it } from "vitest";
import { validateLeadPayload } from "@/lib/validate-lead";

const validBase = {
  fullName: "Jane Doe",
  businessName: "Jane Plumbing",
  email: "jane@example.com",
  contactPref: "email",
  industry: "Plumbing",
  whatYouDo: "Residential plumbing",
  whoYouServe: "Homeowners",
  projectType: "new",
  hostingChoice: "later",
  paymentOption: "deposit",
};

describe("validateLeadPayload", () => {
  it("accepts a minimal valid payload", () => {
    const result = validateLeadPayload(validBase);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("jane@example.com");
      expect(result.data.paymentOption).toBe("deposit");
    }
  });

  it("rejects invalid email", () => {
    const result = validateLeadPayload({ ...validBase, email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Invalid email/i);
  });

  it("rejects invalid hostingChoice", () => {
    const result = validateLeadPayload({ ...validBase, hostingChoice: "weekly" });
    expect(result.ok).toBe(false);
  });
});
