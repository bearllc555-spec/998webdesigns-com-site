import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { BALANCE_AMOUNT_CENTS } from "@/lib/products";
import Stripe from "stripe";

export const runtime = "nodejs";

// Disable body parsing - we need the raw body for webhook verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  // Handle checkout.session.completed for deposit payments
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentType = session.metadata?.paymentType;

    // Only create auth hold for deposit payments
    if (paymentType === "deposit" && session.payment_intent) {
      try {
        // Get the payment intent to find the payment method and customer
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );

        if (paymentIntent.payment_method && paymentIntent.customer) {
          // Create an authorization hold for the $499 balance
          const holdIntent = await stripe.paymentIntents.create({
            amount: BALANCE_AMOUNT_CENTS,
            currency: "usd",
            customer: paymentIntent.customer as string,
            payment_method: paymentIntent.payment_method as string,
            capture_method: "manual", // This creates the auth hold
            confirm: true, // Confirm immediately to place the hold
            off_session: true, // We're charging without the customer present
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

          // The hold is now in place. You can capture it within 7 days using:
          // await stripe.paymentIntents.capture(holdIntent.id)
          // 
          // To cancel/release the hold:
          // await stripe.paymentIntents.cancel(holdIntent.id)
        } else {
          console.warn(
            "[webhook] Could not create auth hold - missing payment_method or customer:",
            { 
              paymentMethod: paymentIntent.payment_method, 
              customer: paymentIntent.customer 
            }
          );
        }
      } catch (err) {
        console.error("[webhook] Failed to create auth hold:", err);
        // Don't return error - the deposit payment was still successful
      }
    }
  }

  // Handle payment_intent.amount_capturable_updated (optional - for logging)
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

  // Handle payment_intent.canceled (auth hold expired or canceled)
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
