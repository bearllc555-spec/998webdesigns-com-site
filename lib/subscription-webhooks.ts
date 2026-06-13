import type Stripe from "stripe";
import { updateLatestWdLeadBySubscriptionId } from "@/lib/leads-db";
import {
  notifyHostingCanceled,
  notifyHostingRenewalFailed,
} from "@/lib/crm-notify-stripe";
import {
  sendInternalHostingCanceledEmail,
  sendInternalHostingRenewalFailedEmail,
} from "@/lib/internal-lead-email";

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.subscription_details;
  if (details?.subscription) {
    const sub = details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  for (const line of invoice.lines?.data ?? []) {
    if (line.subscription) {
      return typeof line.subscription === "string"
        ? line.subscription
        : line.subscription.id;
    }
  }
  return null;
}

/** Failed monthly hosting renewal - alert ops to contact the client. */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  await updateLatestWdLeadBySubscriptionId(subscriptionId, {
    status: "hosting_payment_failed",
  });
  await sendInternalHostingRenewalFailedEmail(invoice, subscriptionId);
  notifyHostingRenewalFailed(invoice, subscriptionId);
}

/** Client canceled month-to-month hosting in Stripe. */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  await updateLatestWdLeadBySubscriptionId(subscription.id, {
    status: "hosting_canceled",
    stripe_subscription_id: null,
  });
  await sendInternalHostingCanceledEmail(subscription);
  notifyHostingCanceled(subscription);
}
