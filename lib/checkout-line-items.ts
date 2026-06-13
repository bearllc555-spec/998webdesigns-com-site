import type Stripe from "stripe";
import {
  cardProcessingFeeCents,
  CARD_PROCESSING_PRODUCT,
  checkoutSubtotalCents,
  type PaymentChannel,
} from "@/lib/checkout-pricing";
import { designPromoSummary, resolveDesignPromo } from "@/lib/design-promo";
import {
  designTotalCents,
} from "@/lib/design-payment-schedule";
import { FULL_PRODUCT, HOSTING_MONTHLY_PRODUCT } from "@/lib/products";
import type { HostingChoice, ValidatedLead } from "@/lib/validate-lead";

function designLineItem(lead: ValidatedLead): Stripe.Checkout.SessionCreateParams.LineItem {
  const promo = resolveDesignPromo(lead.promoCode);
  const isDeposit = lead.paymentOption === "deposit";
  const amount = checkoutSubtotalCents(lead.hostingChoice, lead.promoCode, lead.paymentOption);
  const promoLabel = designPromoSummary(lead.promoCode, lead.hostingChoice);
  const totalLabel = `$${(designTotalCents(lead.promoCode, lead.hostingChoice) / 100).toLocaleString()} total design fee`;
  const scheduleNote = isDeposit
    ? `50% deposit today; 40% after design approval; 10% at launch (${totalLabel}).`
    : FULL_PRODUCT.description;
  const description = promo
    ? `${scheduleNote} (${promo.code} - ${promoLabel})`
    : scheduleNote;

  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: isDeposit ? "Website Design - 50% deposit" : FULL_PRODUCT.name,
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

function cardFeeLineItem(
  lead: ValidatedLead
): Stripe.Checkout.SessionCreateParams.LineItem {
  const feeCents = cardProcessingFeeCents(
    checkoutSubtotalCents(lead.hostingChoice, lead.promoCode, lead.paymentOption)
  );
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
    items.push(cardFeeLineItem(lead));
  }

  return items;
}
