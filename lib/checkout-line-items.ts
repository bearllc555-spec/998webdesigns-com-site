import type Stripe from "stripe";
import {
  DEPOSIT_PRODUCT,
  FULL_PRODUCT,
  HOSTING_TEN_YEAR_PRODUCT,
} from "@/lib/products";
import type { ValidatedLead } from "@/lib/validate-lead";

function designLineItem(product: typeof DEPOSIT_PRODUCT): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: product.name,
        description: product.description,
      },
      unit_amount: product.priceInCents,
    },
    quantity: 1,
  };
}

/** Stripe Checkout line items for design fee + optional ten-year hosting upfront. */
export function buildCheckoutLineItems(lead: ValidatedLead): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const design =
    lead.paymentOption === "full" ? FULL_PRODUCT : DEPOSIT_PRODUCT;
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    designLineItem(design),
  ];

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

  return items;
}
