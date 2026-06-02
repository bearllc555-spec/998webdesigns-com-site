import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendInternalPaymentEmail } from "@/lib/internal-lead-email";
import { ensureBalanceHoldForDeposit } from "@/lib/balance-hold";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import {
  syncWdLeadDepositPaid,
  syncWdLeadPaidInFull,
} from "@/lib/wd-leads-sync";
import Stripe from "stripe";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentType = session.metadata?.paymentType;

    if (paymentType === "full") {
      await syncWdLeadPaidInFull(session);
      try {
        await sendInternalPaymentEmail(session, null);
      } catch (err) {
        console.error("[webhook] Internal payment alert failed:", err);
      }
    } else if (paymentType === "deposit" && session.payment_intent) {
      let holdIntentId: string | null = null;
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );
        holdIntentId = await ensureBalanceHoldForDeposit(session, paymentIntent);
      } catch (err) {
        console.error("[webhook] Failed to create auth hold:", err);
      }

      await syncWdLeadDepositPaid(session, holdIntentId);
      try {
        await sendInternalPaymentEmail(session, holdIntentId);
      } catch (err) {
        console.error("[webhook] Internal payment alert failed:", err);
      }
    } else {
      try {
        await sendInternalPaymentEmail(session, null);
      } catch (err) {
        console.error("[webhook] Internal payment alert failed:", err);
      }
    }
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.metadata?.type === "balance_hold") {
      console.info(
        `[webhook] Auth hold capturable amount updated:`,
        intent.id,
        `$${(intent.amount_capturable / 100).toFixed(2)}`
      );
    }
  }

  if (event.type === "payment_intent.canceled") {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.metadata?.type === "balance_hold") {
      console.warn(
        `[webhook] Auth hold canceled/expired for ${intent.metadata?.email}:`,
        intent.id,
        "Reason:",
        intent.cancellation_reason
      );
    }
  }

  return NextResponse.json({ received: true });
}
