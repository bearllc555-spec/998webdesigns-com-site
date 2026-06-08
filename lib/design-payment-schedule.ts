import { designFeeCents } from "@/lib/design-promo";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import type { HostingChoice, PaymentOption } from "@/lib/validate-lead";

/** Design fee milestone split (must sum to 100). */
export const DESIGN_DEPOSIT_PERCENT = 50;
export const DESIGN_MILESTONE2_PERCENT = 40;
export const DESIGN_MILESTONE3_PERCENT = 10;

export function designTotalCents(
  promoCode?: string,
  hostingChoice?: HostingChoice
): number {
  return designFeeCents(promoCode, hostingChoice);
}

export function designDepositCents(
  promoCode?: string,
  hostingChoice?: HostingChoice
): number {
  return Math.round((designTotalCents(promoCode, hostingChoice) * DESIGN_DEPOSIT_PERCENT) / 100);
}

export function designMilestone2Cents(
  promoCode?: string,
  hostingChoice?: HostingChoice
): number {
  return Math.round((designTotalCents(promoCode, hostingChoice) * DESIGN_MILESTONE2_PERCENT) / 100);
}

export function designMilestone3Cents(
  promoCode?: string,
  hostingChoice?: HostingChoice
): number {
  return Math.round((designTotalCents(promoCode, hostingChoice) * DESIGN_MILESTONE3_PERCENT) / 100);
}

export function designBalanceAfterDepositCents(
  promoCode?: string,
  hostingChoice?: HostingChoice
): number {
  return designTotalCents(promoCode, hostingChoice) - designDepositCents(promoCode, hostingChoice);
}

/** Amount charged at Checkout for the design line (before card fee). */
export function checkoutDesignSubtotalCents(
  paymentOption: PaymentOption,
  promoCode?: string,
  hostingChoice?: HostingChoice
): number {
  return paymentOption === "deposit"
    ? designDepositCents(promoCode, hostingChoice)
    : designTotalCents(promoCode, hostingChoice);
}

export function paymentOptionLabel(option: PaymentOption): string {
  return option === "deposit" ? "50% deposit today" : "Pay in full today";
}

export function designPaymentScheduleLines(
  promoCode?: string,
  hostingChoice?: HostingChoice
): string[] {
  return [
    `50% deposit today — ${formatCheckoutUsd(designDepositCents(promoCode, hostingChoice))}`,
    `40% after design approval or development start — ${formatCheckoutUsd(designMilestone2Cents(promoCode, hostingChoice))}`,
    `10% at launch and handover — ${formatCheckoutUsd(designMilestone3Cents(promoCode, hostingChoice))}`,
    `Total design fee — ${formatCheckoutUsd(designTotalCents(promoCode, hostingChoice))}`,
  ];
}
