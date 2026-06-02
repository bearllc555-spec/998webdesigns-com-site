import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { buildCheckoutLineItems } from "@/lib/checkout-line-items";
import { sendLeadCheckoutEmail } from "@/lib/lead-email";
import { validateLeadPayload } from "@/lib/validate-lead";
import { checkoutOrigin } from "@/lib/checkout-origin";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { insertWdLead } from "@/lib/leads-db";
import { sendInternalLeadSubmittedEmail } from "@/lib/internal-lead-email";
import { syncWdLeadCheckoutCreated } from "@/lib/wd-leads-sync";

export const runtime = "nodejs";

type LeadPayload = Record<string, unknown> & { website?: string };

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/leads");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

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

  const dbResult = await insertWdLead({
    payload,
    email: lead.email,
    business_name: lead.businessName,
    full_name: lead.fullName,
    submitted_at: submittedAt,
    ip,
  });

  if (!dbResult.ok) {
    console.warn(
      `[leads] wd_leads persist skipped (${dbResult.reason}) for ${lead.email} / ${lead.businessName}:`,
      dbResult.detail
    );
  }

  // Create Stripe Checkout session
  try {
    warnIfProductionStripeTestMode("leads");
    const origin = checkoutOrigin(req);

    const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      customer_creation: "always",
      customer_email: lead.email,
      line_items: buildCheckoutLineItems(lead),
      metadata: {
        fullName: lead.fullName,
        businessName: lead.businessName,
        email: lead.email,
        paymentType: "full",
        hostingChoice: lead.hostingChoice,
        submittedAt,
        ...(dbResult.ok && dbResult.id ? { wdLeadId: dbResult.id } : {}),
      },
      payment_intent_data: {
        metadata: {
          fullName: lead.fullName,
          businessName: lead.businessName,
          paymentType: "full",
          hostingChoice: lead.hostingChoice,
        },
        receipt_email: lead.email,
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
    await syncWdLeadCheckoutCreated(dbResult.ok ? dbResult.id : undefined, session);
    await sendInternalLeadSubmittedEmail(lead, session.url, session.id);

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("[leads] Stripe checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
