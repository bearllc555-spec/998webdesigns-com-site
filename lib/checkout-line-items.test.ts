import { describe, expect, it } from "vitest";
import { buildCheckoutLineItems } from "@/lib/checkout-line-items";
import type { ValidatedLead } from "@/lib/validate-lead";

const LINKEDIN20 = "LINKEDIN20";

function lead(overrides: Partial<ValidatedLead> = {}): ValidatedLead {
  return {
    fullName: "Jane Doe",
    businessName: "Jane Plumbing",
    email: "jane@example.com",
    phone: "",
    contactPref: "email",
    industry: "Plumbing",
    yearsInBusiness: "",
    existingUrl: "",
    whatYouDo: "Residential plumbing",
    whoYouServe: "Homeowners",
    projectType: "new",
    visitorActions: [],
    pages: [],
    pagesOther: "",
    brandAssets: [],
    inspirationUrls: "",
    avoidances: "",
    startDate: "",
    hostingChoice: "monthly",
    notes: "",
    paymentOption: "full",
    paymentChannel: "ach",
    addons: [],
    promoCode: "",
    hearAboutSources: ["Google search"],
    hearAboutOther: "",
    ...overrides,
  };
}

describe("buildCheckoutLineItems", () => {
  it("charges design fee only for ten_year at signup (ACH)", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "ten_year" }), "ach");
    expect(items).toHaveLength(1);
    expect(items[0].price_data?.unit_amount).toBe(799800);
  });

  it("adds monthly subscription line with trial (ACH, no card fee)", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "monthly" }), "ach");
    expect(items).toHaveLength(2);
    expect(items[0].price_data?.unit_amount).toBe(799800);
    expect(items[1].price_data?.unit_amount).toBe(9800);
    expect(items[1].price_data?.recurring?.interval).toBe("month");
  });

  it("card fee applies to design only for monthly", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "monthly" }), "card");
    expect(items).toHaveLength(3);
    expect(items[2].price_data?.unit_amount).toBe(23994);
  });

  it("card fee applies to design only for ten_year", () => {
    const items = buildCheckoutLineItems(lead({ hostingChoice: "ten_year" }), "card");
    expect(items).toHaveLength(2);
    expect(items[1].price_data?.unit_amount).toBe(23994);
  });

  it("LINKEDIN20 discounts design line only", () => {
    const items = buildCheckoutLineItems(
      lead({ hostingChoice: "ten_year", promoCode: LINKEDIN20 }),
      "ach"
    );
    expect(items[0].price_data?.unit_amount).toBe(639840);
  });

  it("deposit charges 50% on the design line", () => {
    const items = buildCheckoutLineItems(lead({ paymentOption: "deposit" }), "ach");
    expect(items[0].price_data?.unit_amount).toBe(399900);
    expect(items[0].price_data?.product_data?.name).toContain("50% deposit");
  });
});
