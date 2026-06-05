import { designFeeCents } from "@/lib/design-promo";
import {
  HOSTING_MONTHLY_PRODUCT,
  HOSTING_TEN_YEAR_PRODUCT,
} from "@/lib/products";
import type { HostingChoice } from "@/lib/validate-lead";

export type PaymentChannel = "ach" | "card";

/** Card surcharge on design + in-checkout hosting subtotal (not month-to-month). */
export const CARD_PROCESSING_RATE = 0.03;

export const CARD_PROCESSING_PRODUCT = {
  name: "Card processing (3%)",
  description: "Processing fee for credit/debit card payments.",
} as const;

export function checkoutSubtotalCents(
  hostingChoice: HostingChoice,
  promoCode?: string
): number {
  let total = designFeeCents(promoCode);
  if (hostingChoice === "ten_year") {
    total += HOSTING_TEN_YEAR_PRODUCT.priceInCents;
  }
  return total;
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

/** First Checkout charge: design (+ ten-year) + card fee; monthly adds first month at checkout. */
export function checkoutDueTodayCents(
  hostingChoice: HostingChoice,
  channel: PaymentChannel,
  promoCode?: string
): number {
  let due = checkoutTotalCents(hostingChoice, channel, promoCode);
  if (hostingChoice === "monthly") {
    due += HOSTING_MONTHLY_PRODUCT.priceInCents;
  }
  return due;
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
