import { describe, expect, it } from "vitest";
import {
  checkoutDesignSubtotalCents,
  designBalanceAfterDepositCents,
  designDepositCents,
  designMilestone2Cents,
  designMilestone3Cents,
  designTotalCents,
} from "@/lib/design-payment-schedule";

describe("design payment schedule", () => {
  it("splits 50 / 40 / 10 of list design fee", () => {
    expect(designTotalCents()).toBe(799800);
    expect(designDepositCents()).toBe(399900);
    expect(designMilestone2Cents()).toBe(319920);
    expect(designMilestone3Cents()).toBe(79980);
    expect(
      designDepositCents() + designMilestone2Cents() + designMilestone3Cents()
    ).toBe(designTotalCents());
  });

  it("checkout subtotal is deposit or full", () => {
    expect(checkoutDesignSubtotalCents("deposit")).toBe(399900);
    expect(checkoutDesignSubtotalCents("full")).toBe(799800);
  });

  it("balance after deposit equals milestones 2 + 3", () => {
    expect(designBalanceAfterDepositCents()).toBe(399900);
    expect(designBalanceAfterDepositCents()).toBe(
      designMilestone2Cents() + designMilestone3Cents()
    );
  });
});
