import type Stripe from "stripe";
import { updateLatestWdLeadByEmail, updateWdLead } from "@/lib/leads-db";

/** After Checkout session is created — checkout link sent, payment pending. */
export async function syncWdLeadCheckoutCreated(
  leadId: string | undefined,
  session: Stripe.Checkout.Session
): Promise<void> {
  const patch = {
    status: "awaiting_payment",
    stripe_deposit_invoice_id: session.id,
  };
  if (leadId) {
    await updateWdLead(leadId, patch);
    return;
  }
  const email = session.metadata?.email ?? session.customer_email;
  if (email) await updateLatestWdLeadByEmail(email, patch);
}

/** ACH authorized at Checkout but settlement still pending. */
export async function syncWdLeadAwaitingBankSettlement(
  session: Stripe.Checkout.Session
): Promise<void> {
  const email = session.metadata?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  const patch = {
    status: "awaiting_bank_settlement",
    stripe_customer_id: customerId ?? null,
    stripe_deposit_invoice_id: session.id,
    stripe_balance_invoice_id: null,
    stripe_subscription_id: subscriptionIdFromSession(session),
  };

  const leadId = session.metadata?.wdLeadId;
  if (leadId) {
    await updateWdLead(leadId, patch);
    return;
  }
  if (email) await updateLatestWdLeadByEmail(email, patch);
}

/** ACH debit failed after Checkout was completed. */
export async function syncWdLeadBankPaymentFailed(
  session: Stripe.Checkout.Session
): Promise<void> {
  const email = session.metadata?.email ?? session.customer_email;

  const patch = {
    status: "bank_payment_failed",
    stripe_deposit_invoice_id: session.id,
  };

  const leadId = session.metadata?.wdLeadId;
  if (leadId) {
    await updateWdLead(leadId, patch);
    return;
  }
  if (email) await updateLatestWdLeadByEmail(email, patch);
}

function subscriptionIdFromSession(
  session: Stripe.Checkout.Session
): string | null {
  const sub = session.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export async function syncWdLeadPaidInFull(session: Stripe.Checkout.Session): Promise<void> {
  const email = session.metadata?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  const patch = {
    status: "paid_in_full",
    stripe_customer_id: customerId ?? null,
    stripe_deposit_invoice_id: session.id,
    stripe_balance_invoice_id: null,
    stripe_subscription_id: subscriptionIdFromSession(session),
  };

  const leadId = session.metadata?.wdLeadId;
  if (leadId) {
    await updateWdLead(leadId, patch);
    return;
  }
  if (email) await updateLatestWdLeadByEmail(email, patch);
}
