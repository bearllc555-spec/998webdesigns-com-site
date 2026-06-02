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
  paymentOption: "full",
};

describe("validateLeadPayload", () => {
  it("accepts a minimal valid payload", () => {
    const result = validateLeadPayload(validBase);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("jane@example.com");
      expect(result.data.paymentOption).toBe("full");
    }
  });

  it("defaults to full when paymentOption omitted", () => {
    const { paymentOption: _, ...withoutPayment } = validBase;
    const result = validateLeadPayload(withoutPayment);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.paymentOption).toBe("full");
  });

  it("rejects deposit paymentOption", () => {
    const result = validateLeadPayload({ ...validBase, paymentOption: "deposit" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/full upfront/i);
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
