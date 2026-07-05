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
    expect(checkoutSubtotalCents("monthly")).toBe(799800);
    expect(checkoutSubtotalCents("ten_year")).toBe(799800);
  });

  it("card adds 3% on design fee only", () => {
    expect(cardProcessingFeeCents(799800)).toBe(23994);
    expect(checkoutTotalCents("ten_year", "card")).toBe(823794);
    expect(checkoutTotalCents("monthly", "card")).toBe(823794);
  });

  it("due today is design only - no hosting at signup", () => {
    expect(checkoutDueTodayCents("monthly", "ach")).toBe(799800);
    expect(checkoutDueTodayCents("monthly", "card")).toBe(823794);
    expect(checkoutDueTodayCents("ten_year", "ach")).toBe(799800);
  });

  it("ACH stays at list design price", () => {
    expect(checkoutTotalCents("ten_year", "ach")).toBe(799800);
  });

  it("LINKEDIN20 discounts design fee only", () => {
    expect(checkoutSubtotalCents("monthly", LINKEDIN20)).toBe(639840);
    expect(checkoutDueTodayCents("monthly", "card", LINKEDIN20)).toBe(659035);
  });

  it("50% deposit charges half the design fee today", () => {
    expect(checkoutSubtotalCents("monthly", undefined, "deposit")).toBe(399900);
    expect(checkoutDueTodayCents("monthly", "ach", undefined, "deposit")).toBe(399900);
    expect(checkoutDueTodayCents("monthly", "card", undefined, "deposit")).toBe(411897);
  });
});
