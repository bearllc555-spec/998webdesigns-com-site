import { describe, expect, it, vi, afterEach } from "vitest";
import {
  bundleTotalCents,
  designFeeCents,
  isValidDesignPromoCode,
  listedPromoCodes,
  promoValidationError,
  resolveDesignPromo,
  tenYearHostingFeeCents,
} from "@/lib/design-promo";

describe("design promo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists configured codes", () => {
    expect(listedPromoCodes()).toContain("LINKEDIN20");
    expect(listedPromoCodes()).toContain("LAUNCHPADJUNE26");
    expect(listedPromoCodes()).toContain("GROWTHSYSTEMJUNE26");
  });

  it("accepts LINKEDIN20 case-insensitively", () => {
    expect(isValidDesignPromoCode("linkedin20")).toBe(true);
    expect(isValidDesignPromoCode(" LINKEDIN20 ")).toBe(true);
    expect(isValidDesignPromoCode("WRONG")).toBe(false);
  });

  it("applies 20% off design fee only for channel promos", () => {
    expect(designFeeCents()).toBe(799800);
    expect(designFeeCents("LINKEDIN20")).toBe(639840);
    expect(resolveDesignPromo("LINKEDIN20")?.percentOff).toBe(20);
  });

  it("LAUNCHPADJUNE26 takes $2,000 off design to $5,998", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(designFeeCents("LAUNCHPADJUNE26")).toBe(599800);
    expect(tenYearHostingFeeCents("LAUNCHPADJUNE26")).toBe(299600);
    vi.useRealTimers();
  });

  it("GROWTHSYSTEMJUNE26 requires ten_year hosting and discounts bundle to $7,998", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(isValidDesignPromoCode("GROWTHSYSTEMJUNE26", { hostingChoice: "monthly" })).toBe(
      false
    );
    expect(promoValidationError("GROWTHSYSTEMJUNE26", "monthly")).toMatch(/10-year hosting/i);

    expect(isValidDesignPromoCode("GROWTHSYSTEMJUNE26", { hostingChoice: "ten_year" })).toBe(
      true
    );
    expect(designFeeCents("GROWTHSYSTEMJUNE26", "ten_year")).toBe(599800);
    expect(tenYearHostingFeeCents("GROWTHSYSTEMJUNE26")).toBe(200000);
    expect(bundleTotalCents("GROWTHSYSTEMJUNE26", "ten_year")).toBe(799800);
    vi.useRealTimers();
  });

  it("rejects expired June codes after June 30, 2026 ET", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    expect(isValidDesignPromoCode("LAUNCHPADJUNE26")).toBe(false);
    expect(promoValidationError("LAUNCHPADJUNE26")).toMatch(/expired/i);
  });
});
