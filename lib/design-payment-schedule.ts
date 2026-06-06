import { designFeeCents } from "@/lib/design-promo";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import type { PaymentOption } from "@/lib/validate-lead";

/** Design fee milestone split (must sum to 100). */
export const DESIGN_DEPOSIT_PERCENT = 50;
export const DESIGN_MILESTONE2_PERCENT = 40;
export const DESIGN_MILESTONE3_PERCENT = 10;

export function designTotalCents(promoCode?: string): number {
  return designFeeCents(promoCode);
}

export function designDepositCents(promoCode?: string): number {
  return Math.round((designTotalCents(promoCode) * DESIGN_DEPOSIT_PERCENT) / 100);
}

export function designMilestone2Cents(promoCode?: string): number {
  return Math.round((designTotalCents(promoCode) * DESIGN_MILESTONE2_PERCENT) / 100);
}

export function designMilestone3Cents(promoCode?: string): number {
  return Math.round((designTotalCents(promoCode) * DESIGN_MILESTONE3_PERCENT) / 100);
}

export function designBalanceAfterDepositCents(promoCode?: string): number {
  return designTotalCents(promoCode) - designDepositCents(promoCode);
}

/** Amount charged at Checkout for the design line (before card fee). */
export function checkoutDesignSubtotalCents(
  paymentOption: PaymentOption,
  promoCode?: string
): number {
  return paymentOption === "deposit"
    ? designDepositCents(promoCode)
    : designTotalCents(promoCode);
}

export function paymentOptionLabel(option: PaymentOption): string {
  return option === "deposit" ? "50% deposit today" : "Pay in full today";
}

export function designPaymentScheduleLines(promoCode?: string): string[] {
  return [
    `50% deposit today — ${formatCheckoutUsd(designDepositCents(promoCode))}`,
    `40% after design approval or development start — ${formatCheckoutUsd(designMilestone2Cents(promoCode))}`,
    `10% at launch and handover — ${formatCheckoutUsd(designMilestone3Cents(promoCode))}`,
    `Total design fee — ${formatCheckoutUsd(designTotalCents(promoCode))}`,
  ];
}
