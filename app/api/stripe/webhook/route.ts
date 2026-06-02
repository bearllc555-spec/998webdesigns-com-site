import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendInternalPaymentEmail } from "@/lib/internal-lead-email";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import { syncWdLeadPaidInFull } from "@/lib/wd-leads-sync";
import Stripe from "stripe";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.metadata?.paymentType === "deposit") {
    console.warn(
      `[webhook] Legacy deposit checkout ${session.id} — treating as paid in full (no balance capture)`
    );
  }

  await syncWdLeadPaidInFull(session);
  await sendInternalPaymentEmail(session);
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutCompleted(session);
    } catch (err) {
      console.error("[webhook] checkout.session.completed handler failed:", err);
      return NextResponse.json({ error: "Handler failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
