import type Stripe from "stripe";
import { notifyCrmActivity } from "@/lib/crm-notify";

function sessionContext(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const amount =
    session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)}`
      : undefined;
  return {
    businessName: meta.businessName,
    fullName: meta.fullName,
    email:
      session.customer_details?.email ??
      meta.email ??
      session.customer_email ??
      undefined,
    hostingChoice: meta.hostingChoice,
    paymentChannel: meta.paymentChannel,
    amount,
    stripeSessionId: session.id,
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id,
  };
}

export function notifyLeadPaid(session: Stripe.Checkout.Session): void {
  void notifyCrmActivity({
    kind: "lead_paid",
    status: "paid_in_full",
    ...sessionContext(session),
  });
}

export function notifyLeadAchPending(session: Stripe.Checkout.Session): void {
  void notifyCrmActivity({
    kind: "lead_ach_pending",
    status: "awaiting_bank_settlement",
    ...sessionContext(session),
  });
}

export function notifyLeadAchFailed(session: Stripe.Checkout.Session): void {
  void notifyCrmActivity({
    kind: "lead_ach_failed",
    status: "bank_payment_failed",
    ...sessionContext(session),
  });
}

export function notifyHostingRenewalFailed(
  invoice: Stripe.Invoice,
  subscriptionId: string
): void {
  void notifyCrmActivity({
    kind: "lead_hosting_payment_failed",
    status: "hosting_payment_failed",
    email:
      (invoice as Stripe.Invoice & { customer_email?: string | null }).customer_email ??
      undefined,
    stripeSubscriptionId: subscriptionId,
    amount:
      invoice.amount_due != null
        ? `$${(invoice.amount_due / 100).toFixed(2)}`
        : undefined,
  });
}

export function notifyHostingCanceled(subscription: Stripe.Subscription): void {
  void notifyCrmActivity({
    kind: "lead_hosting_canceled",
    status: "hosting_canceled",
    stripeSubscriptionId: subscription.id,
  });
}

export function notifyLifetimeHostingPaid(session: Stripe.Checkout.Session): void {
  void notifyCrmActivity({
    kind: "lifetime_hosting_paid",
    status: "lifetime_hosting_active",
    ...sessionContext(session),
  });
}

export function notifyLifetimeHostingAchPending(session: Stripe.Checkout.Session): void {
  void notifyCrmActivity({
    kind: "lifetime_hosting_ach_pending",
    status: "awaiting_lifetime_hosting_settlement",
    ...sessionContext(session),
  });
}
