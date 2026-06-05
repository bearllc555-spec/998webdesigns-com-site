import { designFeeCents } from "@/lib/design-promo";
import type { HostingChoice } from "@/lib/validate-lead";

export type PaymentChannel = "ach" | "card";

/** Card surcharge on design fee only (hosting is not charged at initial checkout). */
export const CARD_PROCESSING_RATE = 0.03;

export const CARD_PROCESSING_PRODUCT = {
  name: "Card processing (3%)",
  description: "Processing fee for credit/debit card payments on the design fee.",
} as const;

/** Design fee subtotal at signup — hosting is billed after the 30-day free period. */
export function checkoutSubtotalCents(
  _hostingChoice?: HostingChoice,
  promoCode?: string
): number {
  return designFeeCents(promoCode);
}

export function cardProcessingFeeCents(subtotalCents: number): number {
  return Math.round(subtotalCents * CARD_PROCESSING_RATE);
}

export function checkoutTotalCents(
  hostingChoice: HostingChoice,
  channel: PaymentChannel,
  promoCode?: string
): number {
  const subtotal = checkoutSubtotalCents(hostingChoice, promoCode);
  if (channel === "card") {
    return subtotal + cardProcessingFeeCents(subtotal);
  }
  return subtotal;
}

/** Initial Checkout: design fee (+ 3% card fee on design). No hosting charges today. */
export function checkoutDueTodayCents(
  hostingChoice: HostingChoice,
  channel: PaymentChannel,
  promoCode?: string
): number {
  return checkoutTotalCents(hostingChoice, channel, promoCode);
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
