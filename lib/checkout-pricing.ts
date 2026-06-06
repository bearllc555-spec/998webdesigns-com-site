import { checkoutDesignSubtotalCents } from "@/lib/design-payment-schedule";
import type { PaymentOption } from "@/lib/validate-lead";
import type { HostingChoice } from "@/lib/validate-lead";

export type PaymentChannel = "ach" | "card";

/** Card surcharge on design amount due today (hosting is not charged at initial checkout). */
export const CARD_PROCESSING_RATE = 0.03;

export const CARD_PROCESSING_PRODUCT = {
  name: "Card processing (3%)",
  description: "Processing fee for credit/debit card payments on the design fee.",
} as const;

/** Design subtotal due at Checkout — full fee or 50% deposit. */
export function checkoutSubtotalCents(
  _hostingChoice?: HostingChoice,
  promoCode?: string,
  paymentOption: PaymentOption = "full"
): number {
  return checkoutDesignSubtotalCents(paymentOption, promoCode);
}

export function cardProcessingFeeCents(subtotalCents: number): number {
  return Math.round(subtotalCents * CARD_PROCESSING_RATE);
}

export function checkoutTotalCents(
  hostingChoice: HostingChoice,
  channel: PaymentChannel,
  promoCode?: string,
  paymentOption: PaymentOption = "full"
): number {
  const subtotal = checkoutSubtotalCents(hostingChoice, promoCode, paymentOption);
  if (channel === "card") {
    return subtotal + cardProcessingFeeCents(subtotal);
  }
  return subtotal;
}

/** Initial Checkout: design due today (+ 3% card fee). No hosting charges today. */
export function checkoutDueTodayCents(
  hostingChoice: HostingChoice,
  channel: PaymentChannel,
  promoCode?: string,
  paymentOption: PaymentOption = "full"
): number {
  return checkoutTotalCents(hostingChoice, channel, promoCode, paymentOption);
}

/** Human-readable USD for buttons and emails (no cents when whole dollars). */
export function formatCheckoutUsd(cents: number): string {
  const dollars = cents / 100;
  const hasCents = cents % 100 !== 0;
  return hasCents
    ? dollars.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : dollars.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
}

export function paymentChannelLabel(channel: PaymentChannel): string {
  return channel === "ach" ? "Bank account (ACH)" : "Credit or debit card";
}
