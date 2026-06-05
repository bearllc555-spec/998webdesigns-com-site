import { describe, expect, it } from "vitest";
const LINKEDIN20 = "LINKEDIN20";
import {
  cardProcessingFeeCents,
  checkoutDueTodayCents,
  checkoutSubtotalCents,
  checkoutTotalCents,
} from "@/lib/checkout-pricing";

describe("checkout pricing", () => {
  it("subtotal is design fee only regardless of hosting choice", () => {
    expect(checkoutSubtotalCents("monthly")).toBe(599800);
    expect(checkoutSubtotalCents("ten_year")).toBe(599800);
  });

  it("card adds 3% on design fee only", () => {
    expect(cardProcessingFeeCents(599800)).toBe(17994);
    expect(checkoutTotalCents("ten_year", "card")).toBe(617794);
    expect(checkoutTotalCents("monthly", "card")).toBe(617794);
  });

  it("due today is design only — no hosting at signup", () => {
    expect(checkoutDueTodayCents("monthly", "ach")).toBe(599800);
    expect(checkoutDueTodayCents("monthly", "card")).toBe(617794);
    expect(checkoutDueTodayCents("ten_year", "ach")).toBe(599800);
  });

  it("ACH stays at list design price", () => {
    expect(checkoutTotalCents("ten_year", "ach")).toBe(599800);
  });

  it("LINKEDIN20 discounts design fee only", () => {
    expect(checkoutSubtotalCents("monthly", LINKEDIN20)).toBe(479840);
    expect(checkoutDueTodayCents("monthly", "card", LINKEDIN20)).toBe(494235);
  });
});
