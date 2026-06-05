import { describe, expect, it } from "vitest";
const LINKEDIN20 = "LINKEDIN20";
import {
  cardProcessingFeeCents,
  checkoutDueTodayCents,
  checkoutSubtotalCents,
  checkoutTotalCents,
} from "@/lib/checkout-pricing";

describe("checkout pricing", () => {
  it("subtotal is design only without ten-year hosting", () => {
    expect(checkoutSubtotalCents("later")).toBe(599800);
  });

  it("subtotal includes ten-year hosting", () => {
    expect(checkoutSubtotalCents("ten_year")).toBe(734700);
  });

  it("card adds 3% on design + ten-year subtotal only (not monthly line)", () => {
    expect(cardProcessingFeeCents(599800)).toBe(17994);
    expect(checkoutTotalCents("later", "card")).toBe(617794);
    expect(checkoutTotalCents("ten_year", "card")).toBe(756741);
  });

  it("first month hosting has no card surcharge", () => {
    const designWithCardFee = checkoutTotalCents("later", "card");
    expect(checkoutDueTodayCents("monthly", "card") - designWithCardFee).toBe(19800);
  });

  it("ACH stays at list subtotal", () => {
    expect(checkoutTotalCents("ten_year", "ach")).toBe(734700);
  });

  it("due today includes first month of hosting", () => {
    expect(checkoutDueTodayCents("monthly", "ach")).toBe(619600);
    expect(checkoutDueTodayCents("monthly", "card")).toBe(637594);
  });

  it("LINKEDIN20 discounts design fee only in subtotal", () => {
    expect(checkoutSubtotalCents("later", LINKEDIN20)).toBe(479840);
    expect(checkoutSubtotalCents("ten_year", LINKEDIN20)).toBe(614740);
    expect(checkoutDueTodayCents("monthly", "card", LINKEDIN20)).toBe(514035);
  });
});
