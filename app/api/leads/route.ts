import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { DEPOSIT_PRODUCT, FULL_PRODUCT } from "@/lib/products";
import { sendLeadCheckoutEmail } from "@/lib/lead-email";
import { validateLeadPayload } from "@/lib/validate-lead";
import { checkoutOrigin } from "@/lib/checkout-origin";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";

export const runtime = "nodejs";

type LeadPayload = Record<string, unknown> & { website?: string };

export async function POST(req: NextRequest) {
  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — silently accept and discard
  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  delete body.website;

  const validated = validateLeadPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const lead = validated.data;

  const submittedAt = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const payload = { ...lead, submittedAt };

  // Try to persist lead to Supabase
  const supa = supabaseAdmin();
  if (!supa) {
    console.warn("[leads] Supabase not configured, skipping database insert");
    console.info("[leads] payload preserved:", JSON.stringify(payload));
  } else {
    try {
      const { error } = await supa.from("wd_leads").insert({
        payload,
        email: lead.email,
        business_name: lead.businessName,
        full_name: lead.fullName,
        submitted_at: submittedAt,
        ip,
      });
      if (error) {
        console.warn("[leads] supabase insert failed:", error.message);
        console.info("[leads] payload preserved:", JSON.stringify(payload));
      }
    } catch (err) {
      console.warn("[leads] supabase client error:", err);
      console.info("[leads] payload preserved:", JSON.stringify(payload));
    }
  }

  // Create Stripe Checkout session
  try {
    warnIfProductionStripeTestMode("leads");
    const origin = checkoutOrigin(req);
    const payFull = lead.paymentOption === "full";
    const product = payFull ? FULL_PRODUCT : DEPOSIT_PRODUCT;

    const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      customer_creation: "always",
      customer_email: lead.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        fullName: lead.fullName,
        businessName: lead.businessName,
        email: lead.email,
        paymentType: payFull ? "full" : "deposit",
        hostingChoice: lead.hostingChoice,
        submittedAt,
      },
      payment_intent_data: {
        metadata: {
          fullName: lead.fullName,
          businessName: lead.businessName,
          paymentType: payFull ? "full" : "deposit",
          hostingChoice: lead.hostingChoice,
        },
        receipt_email: lead.email,
        ...(payFull ? {} : { setup_future_usage: "off_session" as const }),
      },
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#start`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    await sendLeadCheckoutEmail(lead, session.url);

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("[leads] Stripe checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
