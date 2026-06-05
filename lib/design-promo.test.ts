import { describe, expect, it } from "vitest";
import {
  DESIGN_PROMO_CODE,
  designFeeCents,
  isValidDesignPromoCode,
} from "@/lib/design-promo";

describe("design promo", () => {
  it("accepts LAUNCH20 case-insensitively", () => {
    expect(isValidDesignPromoCode("launch20")).toBe(true);
    expect(isValidDesignPromoCode(" LAUNCH20 ")).toBe(true);
    expect(isValidDesignPromoCode("WRONG")).toBe(false);
  });

  it("applies 20% off design fee only", () => {
    expect(designFeeCents()).toBe(599800);
    expect(designFeeCents(DESIGN_PROMO_CODE)).toBe(479840);
  });
});
