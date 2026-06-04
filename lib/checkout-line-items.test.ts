import { describe, expect, it } from "vitest";
import { buildCheckoutLineItems } from "@/lib/checkout-line-items";
import type { ValidatedLead } from "@/lib/validate-lead";

function lead(overrides: Partial<ValidatedLead>): ValidatedLead {
  return {
    fullName: "Jane",
    businessName: "Co",
    email: "jane@example.com",
    phone: "",
    contactPref: "email",
    industry: "Plumbing",
    yearsInBusiness: "",
    existingUrl: "",
    whatYouDo: "Plumbing",
    whoYouServe: "Locals",
    projectType: "new",
    visitorActions: [],
    pages: [],
    pagesOther: "",
    brandAssets: [],
    inspirationUrls: "",
    avoidances: "",
    startDate: "",
    hostingChoice: "later",
    notes: "",
    paymentOption: "full",
    paymentChannel: "card",
    addons: [],
    ...overrides,
  };
}

describe("buildCheckoutLineItems", () => {
  it("charges full design fee when hosting is later (ACH)", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "later" }), "ach");
    expect(items).toHaveLength(1);
    expect(items[0].price_data?.unit_amount).toBe(199800);
  });

  it("adds ten-year hosting line item (ACH)", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "ten_year" }), "ach");
    expect(items).toHaveLength(2);
    expect(items[1].price_data?.unit_amount).toBe(134900);
  });

  it("adds 3% card processing fee on subtotal", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "later" }), "card");
    expect(items).toHaveLength(2);
    expect(items[1].price_data?.unit_amount).toBe(5994);
  });

  it("card fee applies to design plus ten-year hosting", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "ten_year" }), "card");
    expect(items).toHaveLength(3);
    expect(items[2].price_data?.unit_amount).toBe(10041);
  });

  it("adds monthly hosting subscription line (ACH, no card fee)", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "monthly" }), "ach");
    expect(items).toHaveLength(2);
    expect(items[1].price_data?.recurring?.interval).toBe("month");
    expect(items[1].price_data?.unit_amount).toBe(19800);
  });

  it("monthly + card: design fee, hosting sub, 3% on design only", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "monthly" }), "card");
    expect(items).toHaveLength(3);
    expect(items[2].price_data?.unit_amount).toBe(5994);
  });
});
