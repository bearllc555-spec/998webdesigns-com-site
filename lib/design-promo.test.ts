import { describe, expect, it } from "vitest";
import {
  designFeeCents,
  isValidDesignPromoCode,
  listedPromoCodes,
  resolveDesignPromo,
} from "@/lib/design-promo";

describe("design promo", () => {
  it("lists configured codes", () => {
    expect(listedPromoCodes()).toContain("LINKEDIN20");
  });

  it("accepts LINKEDIN20 case-insensitively", () => {
    expect(isValidDesignPromoCode("linkedin20")).toBe(true);
    expect(isValidDesignPromoCode(" LINKEDIN20 ")).toBe(true);
    expect(isValidDesignPromoCode("WRONG")).toBe(false);
  });

  it("applies 20% off design fee only for LINKEDIN20", () => {
    expect(designFeeCents()).toBe(599800);
    expect(designFeeCents("LINKEDIN20")).toBe(479840);
    expect(resolveDesignPromo("LINKEDIN20")?.percentOff).toBe(20);
  });
});
