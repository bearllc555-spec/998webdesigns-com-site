import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { BALANCE_AMOUNT_CENTS } from "@/lib/products";
import { findWdLeadForCapture } from "@/lib/leads-db";

function stripeId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = (value as { id?: string }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

const REUSABLE_HOLD_STATUSES = new Set([
  "requires_capture",
  "processing",
  "requires_action",
  "succeeded",
]);

/**
 * Reuse an existing balance hold from wd_leads when webhook retries.
 */
async function existingHoldForDepositSession(
  depositSessionId: string
): Promise<string | null> {
  const lead = await findWdLeadForCapture({ depositSessionId });
  const holdId = lead?.stripe_balance_invoice_id;
  if (!holdId) return null;

  try {
    const intent = await stripe.paymentIntents.retrieve(holdId);
    if (REUSABLE_HOLD_STATUSES.has(intent.status)) {
      return intent.id;
    }
  } catch {
    // stale id — create a new hold below
  }
  return null;
}

/**
 * Idempotent $499 balance authorization hold for a deposit checkout session.
 */
export async function ensureBalanceHoldForDeposit(
  session: Stripe.Checkout.Session,
  paymentIntent: Stripe.PaymentIntent
): Promise<string | null> {
  const existing = await existingHoldForDepositSession(session.id);
  if (existing) {
    console.info(
      `[webhook] Reusing existing balance hold for ${session.metadata?.email}:`,
      existing
    );
    return existing;
  }

  const customerId = stripeId(session.customer) ?? stripeId(paymentIntent.customer);
  const paymentMethodId = stripeId(paymentIntent.payment_method);

  if (!customerId || !paymentMethodId) {
    console.warn(
      "[webhook] Could not create auth hold - missing payment_method or customer:",
      {
        paymentMethod: paymentMethodId,
        customer: customerId,
        sessionCustomer: session.customer,
      }
    );
    return null;
  }

  const holdIntent = await stripe.paymentIntents.create(
    {
      amount: BALANCE_AMOUNT_CENTS,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: "manual",
      confirm: true,
      off_session: true,
      description: "Website Design - Balance Due ($499)",
      metadata: {
        fullName: session.metadata?.fullName || "",
        businessName: session.metadata?.businessName || "",
        email: session.metadata?.email || "",
        type: "balance_hold",
        depositSessionId: session.id,
      },
      receipt_email: session.metadata?.email || undefined,
    },
    { idempotencyKey: `balance_hold_${session.id}` }
  );

  console.info(
    `[webhook] Created $499 auth hold for ${session.metadata?.email}:`,
    holdIntent.id,
    "Status:",
    holdIntent.status
  );

  return holdIntent.id;
}
