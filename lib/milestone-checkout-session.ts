import type Stripe from "stripe";
import {
  cardProcessingFeeCents,
  CARD_PROCESSING_PRODUCT,
  type PaymentChannel,
} from "@/lib/checkout-pricing";
import {
  type DesignMilestoneKey,
  milestoneAmountCents,
  milestoneLineItemDescription,
  milestoneLineItemName,
  milestonePaymentType,
} from "@/lib/design-milestone-payments";
import { checkoutPaymentMethodTypes } from "@/lib/checkout-session";
import type { HostingChoice } from "@/lib/validate-lead";

export type MilestoneCheckoutLead = {
  fullName: string;
  email: string;
  businessName: string;
  promoCode: string;
  paymentChannel: PaymentChannel;
  hostingChoice?: HostingChoice;
};

export function buildMilestoneCheckoutSessionParams(
  lead: MilestoneCheckoutLead,
  milestone: DesignMilestoneKey,
  options: {
    origin: string;
    wdLeadId: string;
    stripeCustomerId?: string | null;
    discoveryProspectId?: string;
  }
): Stripe.Checkout.SessionCreateParams {
  const channel = lead.paymentChannel;
  const subtotal = milestoneAmountCents(milestone, lead.promoCode, lead.hostingChoice);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: milestoneLineItemName(milestone),
          description: milestoneLineItemDescription(
            milestone,
            lead.promoCode,
            lead.hostingChoice
          ),
        },
        unit_amount: subtotal,
      },
      quantity: 1,
    },
  ];

  if (channel === "card") {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: CARD_PROCESSING_PRODUCT.name,
          description: CARD_PROCESSING_PRODUCT.description,
        },
        unit_amount: cardProcessingFeeCents(subtotal),
      },
      quantity: 1,
    });
  }

  const paymentType = milestonePaymentType(milestone);
  const metadata: Stripe.MetadataParam = {
    fullName: lead.fullName,
    businessName: lead.businessName,
    email: lead.email,
    paymentType,
    paymentChannel: channel,
    wdLeadId: options.wdLeadId,
    designMilestone: milestone,
    ...(lead.promoCode.trim() ? { promoCode: lead.promoCode.trim().toUpperCase() } : {}),
    ...(options.discoveryProspectId
      ? { discoveryProspectId: options.discoveryProspectId }
      : {}),
  };

  return {
    mode: "payment",
    customer: options.stripeCustomerId ?? undefined,
    customer_email: options.stripeCustomerId ? undefined : lead.email,
    payment_method_types: checkoutPaymentMethodTypes(channel),
    line_items: lineItems,
    metadata,
    success_url: `${options.origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.origin}/crm`,
    payment_intent_data: {
      metadata,
      receipt_email: lead.email,
    },
  };
}
