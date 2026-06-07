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
  hostingChoice: "monthly",
  paymentOption: "deposit",
  paymentChannel: "ach",
  addons: [],
  hearAboutSources: ["Google search"],
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

  it("defaults to deposit when paymentOption omitted", () => {
    const { paymentOption, ...withoutPayment } = validBase;
    void paymentOption;
    const result = validateLeadPayload(withoutPayment);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.paymentOption).toBe("deposit");
  });

  it("accepts full paymentOption for legacy checkouts", () => {
    const result = validateLeadPayload({ ...validBase, paymentOption: "full" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.paymentOption).toBe("full");
  });

  it("rejects invalid paymentOption", () => {
    const result = validateLeadPayload({ ...validBase, paymentOption: "half" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/paymentOption/i);
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

  it("rejects removed later hostingChoice", () => {
    const result = validateLeadPayload({ ...validBase, hostingChoice: "later" });
    expect(result.ok).toBe(false);
  });

  it("accepts ten_year hostingChoice", () => {
    const result = validateLeadPayload({ ...validBase, hostingChoice: "ten_year" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.hostingChoice).toBe("ten_year");
  });

  it("rejects legacy lifetime hostingChoice", () => {
    const result = validateLeadPayload({ ...validBase, hostingChoice: "lifetime" });
    expect(result.ok).toBe(false);
  });

  it("rejects missing paymentChannel", () => {
    const { paymentChannel, ...withoutChannel } = validBase;
    void paymentChannel;
    const result = validateLeadPayload(withoutChannel);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/paymentChannel/i);
  });

  it("accepts empty company name", () => {
    const result = validateLeadPayload({ ...validBase, businessName: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.businessName).toBe("");
  });

  it("requires hearAboutOther when Other is selected", () => {
    const result = validateLeadPayload({
      ...validBase,
      hearAboutSources: ["Other"],
      hearAboutOther: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/specify/i);
  });

  it("requires at least one hearAboutSources", () => {
    const result = validateLeadPayload({ ...validBase, hearAboutSources: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/heard about us/i);
  });

  it("rejects invalid promo codes", () => {
    const result = validateLeadPayload({ ...validBase, promoCode: "NOTREAL" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/promo/i);
  });

  it("requires phone when contactPref is phone", () => {
    const result = validateLeadPayload({ ...validBase, contactPref: "phone", phone: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/phone/i);
  });

  it("filters hearAboutSources to allowed values", () => {
    const result = validateLeadPayload({
      ...validBase,
      hearAboutSources: ["LinkedIn", "spam", "Google search"],
      hearAboutOther: "Podcast",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hearAboutSources).toEqual(["LinkedIn", "Google search"]);
      expect(result.data.hearAboutOther).toBe("Podcast");
    }
  });
});
