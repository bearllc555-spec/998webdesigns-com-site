import type Stripe from "stripe";
import {
  designBalanceAfterDepositCents,
  designDepositCents,
  designTotalCents,
} from "@/lib/design-payment-schedule";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";

export function buildSiteforgeCheckoutParams(options: {
  origin: string;
  jobId: string;
  email: string;
  fullName: string;
  businessName: string;
  previewUrl: string | null;
  token: string;
}): Stripe.Checkout.SessionCreateParams {
  const deposit = designDepositCents();
  const total = designTotalCents();
  const balance = designBalanceAfterDepositCents();

  const metadata: Stripe.MetadataParam = {
    siteforgeJobId: options.jobId,
    paymentType: "deposit",
    paymentChannel: "card",
    hostingChoice: "monthly",
    fullName: options.fullName,
    businessName: options.businessName,
    email: options.email,
    designTotalCents: String(total),
    designBalanceCents: String(balance),
    source: "siteforge",
    ...(options.previewUrl ? { previewUrl: options.previewUrl.slice(0, 500) } : {}),
  };

  return {
    mode: "payment",
    customer_email: options.email,
    customer_creation: "always",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: deposit,
          product_data: {
            name: "Website design — 50% deposit",
            description: `Total design fee ${formatCheckoutUsd(total)}. Balance due after launch milestones.`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: {
      metadata: {
        siteforgeJobId: options.jobId,
        paymentType: "deposit",
        fullName: options.fullName,
        businessName: options.businessName,
      },
      receipt_email: options.email,
    },
    success_url: `${options.origin}/siteforge/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.origin}/siteforge/approve/${encodeURIComponent(options.token)}`,
  };
}
