import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  sendInternalAchFailedEmail,
  sendInternalLifetimeHostingPaidEmail,
  sendInternalPaymentEmail,
} from "@/lib/internal-lead-email";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import {
  notifyLeadAchFailed,
  notifyLeadAchPending,
  notifyLeadDepositPaid,
  notifyLeadPaid,
  notifyLifetimeHostingAchPending,
  notifyLifetimeHostingPaid,
} from "@/lib/crm-notify-stripe";
import {
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
} from "@/lib/subscription-webhooks";
import { syncDiscoveryProspectAfterPayment } from "@/lib/discovery-payment-sync";
import {
  isLifetimeHostingCheckout,
  syncWdLeadAwaitingBankSettlement,
  syncWdLeadBankPaymentFailed,
  syncWdLeadDepositPaid,
  syncWdLeadPaidInFull,
} from "@/lib/wd-leads-sync";
import {
  claimStripeWebhookEvent,
  markStripeWebhookProcessedInMemory,
  releaseStripeWebhookClaim,
} from "@/lib/stripe-webhook-idempotency";
import Stripe from "stripe";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function isDesignAchPending(session: Stripe.Checkout.Session): boolean {
  return (
    session.metadata?.paymentChannel === "ach" &&
    session.payment_status === "unpaid" &&
    session.status === "complete"
  );
}

function isLifetimeAchPending(session: Stripe.Checkout.Session): boolean {
  return (
    isLifetimeHostingCheckout(session) &&
    session.payment_status === "unpaid" &&
    session.status === "complete" &&
    (session.payment_method_types?.includes("us_bank_account") ?? false)
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const lifetime = isLifetimeHostingCheckout(session);
  const isDeposit = session.metadata?.paymentType === "deposit";

  if (session.payment_status === "paid") {
    if (isDeposit) {
      await syncWdLeadDepositPaid(session);
      await syncDiscoveryProspectAfterPayment(session, "deposit_paid");
      if (lifetime) {
        await sendInternalLifetimeHostingPaidEmail(session);
        notifyLifetimeHostingPaid(session);
      } else {
        await sendInternalPaymentEmail(session);
        notifyLeadDepositPaid(session);
      }
    } else {
      await syncWdLeadPaidInFull(session);
      await syncDiscoveryProspectAfterPayment(session, "paid");
      if (lifetime) {
        await sendInternalLifetimeHostingPaidEmail(session);
        notifyLifetimeHostingPaid(session);
      } else {
        await sendInternalPaymentEmail(session);
        notifyLeadPaid(session);
      }
    }
    return;
  }

  if (isLifetimeAchPending(session)) {
    notifyLifetimeHostingAchPending(session);
    return;
  }

  if (isDesignAchPending(session)) {
    await syncWdLeadAwaitingBankSettlement(session);
    notifyLeadAchPending(session);
    return;
  }

  console.warn(
    `[webhook] checkout.session.completed unhandled payment_status=${session.payment_status} channel=${session.metadata?.paymentChannel} session=${session.id}`
  );
}

async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session): Promise<void> {
  const isDeposit = session.metadata?.paymentType === "deposit";

  if (isDeposit) {
    await syncWdLeadDepositPaid(session);
    await syncDiscoveryProspectAfterPayment(session, "deposit_paid");
    await sendInternalPaymentEmail(session, { settledAfterAch: true });
    notifyLeadDepositPaid(session);
    return;
  }

  await syncWdLeadPaidInFull(session);
  await syncDiscoveryProspectAfterPayment(session, "paid");
  if (isLifetimeHostingCheckout(session)) {
    await sendInternalLifetimeHostingPaidEmail(session, { settledAfterAch: true });
    notifyLifetimeHostingPaid(session);
    return;
  }
  await sendInternalPaymentEmail(session, { settledAfterAch: true });
  notifyLeadPaid(session);
}

export async function POST(req: NextRequest) {
  warnIfProductionStripeTestMode("webhook");
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const claim = await claimStripeWebhookEvent(event.id);
  if (claim === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleAsyncPaymentSucceeded(session);
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await syncWdLeadBankPaymentFailed(session);
      await sendInternalAchFailedEmail(session);
      notifyLeadAchFailed(session);
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
    }

    if (claim === "unavailable") {
      markStripeWebhookProcessedInMemory(event.id);
    }
  } catch (err) {
    console.error(`[webhook] ${event.type} handler failed:`, err);
    if (claim === "new") {
      await releaseStripeWebhookClaim(event.id);
    }
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
