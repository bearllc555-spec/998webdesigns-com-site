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
    ...overrides,
  };
}

describe("buildCheckoutLineItems", () => {
  it("charges full design fee when hosting is later", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "later" }));
    expect(items).toHaveLength(1);
    expect(items[0].price_data?.unit_amount).toBe(99800);
  });

  it("adds ten-year hosting line item", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "ten_year" }));
    expect(items).toHaveLength(2);
    expect(items[1].price_data?.unit_amount).toBe(99800);
  });
});
