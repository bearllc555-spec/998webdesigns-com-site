import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { DEPOSIT_PRODUCT, FULL_PRODUCT, BALANCE_AMOUNT_CENTS } from "@/lib/products";

export const runtime = "nodejs";

type LeadPayload = Record<string, unknown> & { website?: string; paymentOption?: 'deposit' | 'full' };

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

  // Basic shape check
  const required = ["fullName", "businessName", "email"];
  for (const f of required) {
    if (!body[f] || typeof body[f] !== "string") {
      return NextResponse.json(
        { error: `Missing required field: ${f}` },
        { status: 400 }
      );
    }
  }

  const submittedAt = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  // Try to persist lead to Supabase
  const supa = supabaseAdmin();
  if (!supa) {
    console.warn("[leads] Supabase not configured, skipping database insert");
    console.info("[leads] payload preserved:", JSON.stringify(body));
  } else {
    try {
      const { error } = await supa.from("wd_leads").insert({
        payload: body,
        email: body.email,
        business_name: body.businessName,
        full_name: body.fullName,
        submitted_at: submittedAt,
        ip,
      });
      if (error) {
        console.warn("[leads] supabase insert failed:", error.message);
        console.info("[leads] payload preserved:", JSON.stringify(body));
      }
    } catch (err) {
      console.warn("[leads] supabase client error:", err);
      console.info("[leads] payload preserved:", JSON.stringify(body));
    }
  }

  // Create Stripe Checkout session
  try {
    const origin = req.headers.get("origin") || "https://998webdesigns.com";
    const payFull = body.paymentOption === 'full';
    const product = payFull ? FULL_PRODUCT : DEPOSIT_PRODUCT;
    
    // For deposit payments, we'll save the card for future use (to create auth hold after)
    const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      customer_email: body.email as string,
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
        fullName: body.fullName as string,
        businessName: body.businessName as string,
        email: body.email as string,
        paymentType: payFull ? 'full' : 'deposit',
        submittedAt,
      },
      payment_intent_data: {
        metadata: {
          fullName: body.fullName as string,
          businessName: body.businessName as string,
          paymentType: payFull ? 'full' : 'deposit',
        },
        receipt_email: body.email as string,
        // For deposit: save card for future use to create the balance auth hold
        ...(payFull ? {} : { setup_future_usage: 'off_session' as const }),
      },
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}&type=${payFull ? 'full' : 'deposit'}`,
      cancel_url: `${origin}/#start`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("[leads] Stripe checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
