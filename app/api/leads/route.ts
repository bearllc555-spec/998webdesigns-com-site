import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { buildCheckoutSessionParams } from "@/lib/checkout-session";
import { sendLeadCheckoutEmail } from "@/lib/lead-email";
import { validateLeadPayload } from "@/lib/validate-lead";
import { checkoutOrigin } from "@/lib/checkout-origin";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { insertWdLead } from "@/lib/leads-db";
import { readJsonBody } from "@/lib/read-json-body";
import { sendInternalLeadSubmittedEmail } from "@/lib/internal-lead-email";
import { notifyCrmActivity } from "@/lib/crm-notify";
import { syncWdLeadCheckoutCreated } from "@/lib/wd-leads-sync";

export const runtime = "nodejs";

type LeadPayload = Record<string, unknown> & { website?: string };

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/leads");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    const status = parsed.error === "Request body too large" ? 413 : 400;
    return NextResponse.json({ error: parsed.error }, { status });
  }
  const body = parsed.body as LeadPayload;

  // Honeypot - silently accept and discard
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
  } else {
    void notifyCrmActivity({
      kind: "lead_submitted",
      businessName: lead.businessName,
      fullName: lead.fullName,
      email: lead.email,
      status: "new",
      hostingChoice: lead.hostingChoice,
      paymentChannel: lead.paymentChannel,
    });
  }

  // Create Stripe Checkout session
  try {
    warnIfProductionStripeTestMode("leads");
    const origin = checkoutOrigin(req);

    const sessionConfig = buildCheckoutSessionParams(lead, {
      origin,
      submittedAt,
      wdLeadId: dbResult.ok && dbResult.id ? dbResult.id : undefined,
    });

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

    void notifyCrmActivity({
      kind: "lead_checkout",
      businessName: lead.businessName,
      fullName: lead.fullName,
      email: lead.email,
      status: "awaiting_payment",
      hostingChoice: lead.hostingChoice,
      paymentChannel: lead.paymentChannel,
      checkoutUrl: session.url,
      stripeSessionId: session.id,
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("[leads] Stripe checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
