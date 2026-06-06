import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { buildCheckoutSessionParams } from "@/lib/checkout-session";
import { checkoutOrigin } from "@/lib/checkout-origin";
import { discoveryProspectToLead } from "@/lib/discovery-to-lead";
import {
  getDiscoveryProspect,
  linkDiscoveryWdLead,
} from "@/lib/discovery-db";
import { verifyDiscoveryToken } from "@/lib/discovery-token";
import { sendLeadCheckoutEmail } from "@/lib/lead-email";
import { insertWdLead } from "@/lib/leads-db";
import { readJsonBody } from "@/lib/read-json-body";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { sendInternalLeadSubmittedEmail } from "@/lib/internal-lead-email";
import { notifyCrmActivity } from "@/lib/crm-notify";
import { syncWdLeadCheckoutCreated } from "@/lib/wd-leads-sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const payload = verifyDiscoveryToken(token, "close");
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const prospect = await getDiscoveryProspect(payload.prospectId);
  if (!prospect?.intake || !prospect.close_draft) {
    return NextResponse.json({ error: "Checkout not ready" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    fullName: prospect.full_name,
    businessName: prospect.intake.businessName,
    closeDraft: prospect.close_draft,
  });
}

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/discovery/close-checkout");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = typeof parsed.body.token === "string" ? parsed.body.token.trim() : "";
  const payload = verifyDiscoveryToken(token, "close");
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const prospect = await getDiscoveryProspect(payload.prospectId);
  if (!prospect?.intake || !prospect.close_draft) {
    return NextResponse.json({ error: "Checkout not ready" }, { status: 404 });
  }

  const leadResult = discoveryProspectToLead(prospect, prospect.intake, prospect.close_draft);
  if (!leadResult.ok) {
    return NextResponse.json({ error: leadResult.error }, { status: 400 });
  }
  const lead = leadResult.data;

  const submittedAt = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const dbResult = await insertWdLead({
    payload: { ...lead, submittedAt, discoveryProspectId: prospect.id },
    email: lead.email,
    business_name: lead.businessName,
    full_name: lead.fullName,
    submitted_at: submittedAt,
    ip,
  });

  try {
    warnIfProductionStripeTestMode("discovery-close");
    const origin = checkoutOrigin(req);
    const sessionConfig = buildCheckoutSessionParams(lead, {
      origin,
      submittedAt,
      wdLeadId: dbResult.ok && dbResult.id ? dbResult.id : undefined,
      discoveryProspectId: prospect.id,
    });
    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    await sendLeadCheckoutEmail(lead, session.url);
    await syncWdLeadCheckoutCreated(dbResult.ok ? dbResult.id : undefined, session);
    await sendInternalLeadSubmittedEmail(lead, session.url, session.id);

    if (dbResult.ok && dbResult.id) {
      await linkDiscoveryWdLead(prospect.id, dbResult.id);
    }

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
    console.error("[discovery-close] Stripe error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
