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

/** After deposit checkout completes and optional balance hold is placed. */
export async function syncWdLeadDepositPaid(
  session: Stripe.Checkout.Session,
  holdIntentId: string | null
): Promise<void> {
  const email = session.metadata?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  const patch = {
    status: holdIntentId ? "balance_held" : "deposit_paid",
    stripe_customer_id: customerId ?? null,
    stripe_deposit_invoice_id: session.id,
    stripe_balance_invoice_id: holdIntentId,
  };

  const leadId = session.metadata?.wdLeadId;
  if (leadId) {
    await updateWdLead(leadId, patch);
    return;
  }
  if (email) await updateLatestWdLeadByEmail(email, patch);
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
  };

  const leadId = session.metadata?.wdLeadId;
  if (leadId) {
    await updateWdLead(leadId, patch);
    return;
  }
  if (email) await updateLatestWdLeadByEmail(email, patch);
}
