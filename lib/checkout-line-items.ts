import type Stripe from "stripe";
import {
  cardProcessingFeeCents,
  CARD_PROCESSING_PRODUCT,
  checkoutSubtotalCents,
  type PaymentChannel,
} from "@/lib/checkout-pricing";
import { FULL_PRODUCT, HOSTING_TEN_YEAR_PRODUCT } from "@/lib/products";
import type { ValidatedLead } from "@/lib/validate-lead";

function designLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: FULL_PRODUCT.name,
        description: FULL_PRODUCT.description,
      },
      unit_amount: FULL_PRODUCT.priceInCents,
    },
    quantity: 1,
  };
}

/** Stripe Checkout line items for design + optional ten-year hosting + optional card fee. */
export function buildCheckoutLineItems(
  lead: ValidatedLead,
  channel: PaymentChannel
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [designLineItem()];

  if (lead.hostingChoice === "ten_year") {
    items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: HOSTING_TEN_YEAR_PRODUCT.name,
          description: HOSTING_TEN_YEAR_PRODUCT.description,
        },
        unit_amount: HOSTING_TEN_YEAR_PRODUCT.priceInCents,
      },
      quantity: 1,
    });
  }

  if (channel === "card") {
    const feeCents = cardProcessingFeeCents(checkoutSubtotalCents(lead.hostingChoice));
    items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: CARD_PROCESSING_PRODUCT.name,
          description: CARD_PROCESSING_PRODUCT.description,
        },
        unit_amount: feeCents,
      },
      quantity: 1,
    });
  }

  return items;
}
