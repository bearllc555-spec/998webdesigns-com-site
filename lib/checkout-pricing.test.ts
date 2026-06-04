import { describe, expect, it } from "vitest";
import {
  cardProcessingFeeCents,
  checkoutSubtotalCents,
  checkoutTotalCents,
} from "@/lib/checkout-pricing";

describe("checkout pricing", () => {
  it("subtotal is design only without ten-year hosting", () => {
    expect(checkoutSubtotalCents("later")).toBe(199800);
  });

  it("subtotal includes ten-year hosting", () => {
    expect(checkoutSubtotalCents("ten_year")).toBe(334700);
  });

  it("card adds 3% on full cart", () => {
    expect(cardProcessingFeeCents(199800)).toBe(5994);
    expect(checkoutTotalCents("later", "card")).toBe(205794);
    expect(checkoutTotalCents("ten_year", "card")).toBe(344741);
  });

  it("ACH stays at list subtotal", () => {
    expect(checkoutTotalCents("ten_year", "ach")).toBe(334700);
  });
});
