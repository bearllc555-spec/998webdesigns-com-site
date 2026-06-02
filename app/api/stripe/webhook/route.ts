import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { BALANCE_AMOUNT_CENTS } from "@/lib/products";
import { sendInternalPaymentEmail } from "@/lib/internal-lead-email";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import Stripe from "stripe";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function stripeId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = (value as { id?: string }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
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
    const paymentType = session.metadata?.paymentType;

    try {
      await sendInternalPaymentEmail(session);
    } catch (err) {
      console.error("[webhook] Internal payment alert failed:", err);
    }

    if (paymentType === "deposit" && session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );

        const customerId =
          stripeId(session.customer) ?? stripeId(paymentIntent.customer);
        const paymentMethodId = stripeId(paymentIntent.payment_method);

        if (customerId && paymentMethodId) {
          const holdIntent = await stripe.paymentIntents.create({
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
          });

          console.info(
            `[webhook] Created $499 auth hold for ${session.metadata?.email}:`,
            holdIntent.id,
            "Status:",
            holdIntent.status
          );
        } else {
          console.warn(
            "[webhook] Could not create auth hold - missing payment_method or customer:",
            {
              paymentMethod: paymentMethodId,
              customer: customerId,
              sessionCustomer: session.customer,
            }
          );
        }
      } catch (err) {
        console.error("[webhook] Failed to create auth hold:", err);
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
