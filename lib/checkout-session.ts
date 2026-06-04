import type Stripe from "stripe";
import {
  buildCheckoutLineItems,
  checkoutUsesSubscriptionMode,
} from "@/lib/checkout-line-items";
import type { PaymentChannel } from "@/lib/checkout-pricing";
import type { ValidatedLead } from "@/lib/validate-lead";

export function checkoutPaymentMethodTypes(
  channel: PaymentChannel
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  return channel === "ach" ? ["us_bank_account"] : ["card"];
}

export function buildCheckoutSessionParams(
  lead: ValidatedLead,
  options: {
    origin: string;
    submittedAt: string;
    wdLeadId?: string;
  }
): Stripe.Checkout.SessionCreateParams {
  const channel: PaymentChannel = lead.paymentChannel;
  const lineItems = buildCheckoutLineItems(lead, channel);
  const subscriptionMode = checkoutUsesSubscriptionMode(lead.hostingChoice);

  const metadata: Stripe.MetadataParam = {
    fullName: lead.fullName,
    businessName: lead.businessName,
    email: lead.email,
    paymentType: "full",
    paymentChannel: channel,
    hostingChoice: lead.hostingChoice,
    submittedAt: options.submittedAt,
    ...(options.wdLeadId ? { wdLeadId: options.wdLeadId } : {}),
  };

  const shared: Stripe.Checkout.SessionCreateParams = {
    customer_email: lead.email,
    payment_method_types: checkoutPaymentMethodTypes(channel),
    line_items: lineItems,
    metadata,
    success_url: `${options.origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.origin}/#start`,
  };

  if (subscriptionMode) {
    return {
      ...shared,
      mode: "subscription",
      subscription_data: {
        metadata: {
          fullName: lead.fullName,
          businessName: lead.businessName,
          paymentType: "full",
          paymentChannel: channel,
          hostingChoice: lead.hostingChoice,
        },
      },
    };
  }

  return {
    ...shared,
    mode: "payment",
    customer_creation: "always",
    payment_intent_data: {
      metadata: {
        fullName: lead.fullName,
        businessName: lead.businessName,
        paymentType: "full",
        paymentChannel: channel,
        hostingChoice: lead.hostingChoice,
      },
      receipt_email: lead.email,
    },
  };
}
