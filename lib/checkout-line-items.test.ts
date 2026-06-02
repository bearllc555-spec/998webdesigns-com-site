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
    paymentOption: "deposit",
    ...overrides,
  };
}

describe("buildCheckoutLineItems", () => {
  it("charges deposit only when hosting is later", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "later" }));
    expect(items).toHaveLength(1);
    expect(items[0].price_data?.unit_amount).toBe(49900);
  });

  it("adds ten-year hosting line item", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "ten_year" }));
    expect(items).toHaveLength(2);
    expect(items[1].price_data?.unit_amount).toBe(99800);
  });

  it("uses full design price when pay-in-full", () => {
    const items = buildCheckoutLineItems(
      lead({ paymentOption: "full", hostingChoice: "later" })
    );
    expect(items[0].price_data?.unit_amount).toBe(99800);
  });
});
