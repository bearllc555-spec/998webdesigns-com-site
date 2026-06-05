import type Stripe from "stripe";
import {
  cardProcessingFeeCents,
  CARD_PROCESSING_PRODUCT,
  checkoutSubtotalCents,
  type PaymentChannel,
} from "@/lib/checkout-pricing";
import { designFeeCents, designPromoSummary, resolveDesignPromo } from "@/lib/design-promo";
import { FULL_PRODUCT, HOSTING_MONTHLY_PRODUCT } from "@/lib/products";
import type { HostingChoice, ValidatedLead } from "@/lib/validate-lead";

function designLineItem(lead: ValidatedLead): Stripe.Checkout.SessionCreateParams.LineItem {
  const promo = resolveDesignPromo(lead.promoCode);
  const amount = designFeeCents(lead.promoCode);
  const promoLabel = designPromoSummary(lead.promoCode);
  const description = promo
    ? `${FULL_PRODUCT.description} (${promo.code} — ${promoLabel})`
    : FULL_PRODUCT.description;

  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: FULL_PRODUCT.name,
        description,
      },
      unit_amount: amount,
    },
    quantity: 1,
  };
}

function monthlyHostingLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: HOSTING_MONTHLY_PRODUCT.name,
        description: HOSTING_MONTHLY_PRODUCT.description,
      },
      unit_amount: HOSTING_MONTHLY_PRODUCT.priceInCents,
      recurring: { interval: "month" },
    },
    quantity: 1,
  };
}

function cardFeeLineItem(promoCode?: string): Stripe.Checkout.SessionCreateParams.LineItem {
  const feeCents = cardProcessingFeeCents(checkoutSubtotalCents(undefined, promoCode));
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: CARD_PROCESSING_PRODUCT.name,
        description: CARD_PROCESSING_PRODUCT.description,
      },
      unit_amount: feeCents,
    },
    quantity: 1,
  };
}

export function checkoutUsesSubscriptionMode(hostingChoice: HostingChoice): boolean {
  return hostingChoice === "monthly";
}

/** Stripe Checkout line items: design today; monthly adds $0-trial subscription line. */
export function buildCheckoutLineItems(
  lead: ValidatedLead,
  channel: PaymentChannel
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [designLineItem(lead)];

  if (lead.hostingChoice === "monthly") {
    items.push(monthlyHostingLineItem());
  }

  if (channel === "card") {
    items.push(cardFeeLineItem(lead.promoCode));
  }

  return items;
}
