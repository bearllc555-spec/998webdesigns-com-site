import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { checkoutOrigin } from "@/lib/checkout-origin";
import {
  canSendMilestoneInvoice,
  mergeMilestoneSent,
  type DesignMilestoneKey,
} from "@/lib/design-milestone-payments";
import { getWdLeadById, updateWdLead } from "@/lib/leads-db";
import { buildMilestoneCheckoutSessionParams } from "@/lib/milestone-checkout-session";
import {
  sendMilestoneInvoiceEmail,
  sendMilestoneInvoiceSms,
} from "@/lib/milestone-invoice-email";
import { notifyCrmActivity } from "@/lib/crm-notify";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { readJsonBody } from "@/lib/read-json-body";
import { stripe } from "@/lib/stripe";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import type { PaymentChannel } from "@/lib/validate-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMilestone(value: unknown): DesignMilestoneKey | null {
  if (value === 2 || value === "2" || value === "milestone2") return "milestone2";
  if (value === 3 || value === "3" || value === "milestone3") return "milestone3";
  return null;
}

function leadPaymentChannel(
  payload: Record<string, unknown>,
  override?: PaymentChannel
): PaymentChannel {
  if (override === "ach" || override === "card") return override;
  return payload.paymentChannel === "ach" ? "ach" : "card";
}

function leadPromoCode(payload: Record<string, unknown>): string {
  return typeof payload.promoCode === "string" ? payload.promoCode : "";
}

function leadPhone(payload: Record<string, unknown>): string {
  return typeof payload.phone === "string" ? payload.phone.trim() : "";
}

function discoveryProspectId(payload: Record<string, unknown>): string | undefined {
  const value = payload.discoveryProspectId;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;
  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const milestone = parseMilestone(parsed.body.milestone);
  if (!milestone) {
    return NextResponse.json({ error: "milestone must be 2 or 3" }, { status: 400 });
  }

  const sendEmail = parsed.body.sendEmail !== false;
  const sendSms = parsed.body.sendSms === true;
  if (!sendEmail && !sendSms) {
    return NextResponse.json({ error: "Choose email, SMS, or both" }, { status: 400 });
  }

  const lead = await getWdLeadById(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const eligibility = canSendMilestoneInvoice(lead.status, lead.payload, milestone);
  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.error }, { status: 400 });
  }

  const paymentChannel = leadPaymentChannel(
    lead.payload,
    parsed.body.paymentChannel === "ach" || parsed.body.paymentChannel === "card"
      ? parsed.body.paymentChannel
      : undefined
  );
  const promoCode = leadPromoCode(lead.payload);
  const phone = leadPhone(lead.payload);

  if (sendSms && !phone) {
    return NextResponse.json({ error: "No phone number on this lead for SMS" }, { status: 400 });
  }

  try {
    warnIfProductionStripeTestMode("crm-milestone-invoice");
    const origin = checkoutOrigin(req);
    const session = await stripe.checkout.sessions.create(
      buildMilestoneCheckoutSessionParams(
        {
          fullName: lead.full_name,
          email: lead.email,
          businessName: lead.business_name,
          promoCode,
          paymentChannel,
        },
        milestone,
        {
          origin,
          wdLeadId: lead.id,
          stripeCustomerId: lead.stripe_customer_id,
          discoveryProspectId: discoveryProspectId(lead.payload),
        }
      )
    );

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    const payload = mergeMilestoneSent(lead.payload, milestone, session.id);
    const saved = await updateWdLead(leadId, { payload });
    if (!saved) {
      return NextResponse.json({ error: "Could not save invoice state" }, { status: 500 });
    }

    const deliveryErrors: string[] = [];

    if (sendEmail) {
      const emailed = await sendMilestoneInvoiceEmail({
        fullName: lead.full_name,
        email: lead.email,
        businessName: lead.business_name,
        milestone,
        promoCode,
        paymentChannel,
        checkoutUrl: session.url,
      });
      if (!emailed) deliveryErrors.push("email");
    }

    if (sendSms) {
      const sms = await sendMilestoneInvoiceSms({
        phone,
        fullName: lead.full_name,
        milestone,
        checkoutUrl: session.url,
      });
      if (!sms.ok) deliveryErrors.push(sms.error);
    }

    void notifyCrmActivity({
      kind: "lead_checkout",
      businessName: lead.business_name,
      fullName: lead.full_name,
      email: lead.email,
      status: "awaiting_payment",
      checkoutUrl: session.url,
      stripeSessionId: session.id,
      message:
        milestone === "milestone2"
          ? "40% design milestone invoice sent"
          : "10% design milestone invoice sent",
    });

    if (deliveryErrors.length) {
      const channels = [sendEmail && "email", sendSms && "SMS"].filter(Boolean).join(" and ");
      return NextResponse.json(
        {
          error: `Checkout created but delivery failed (${channels}): ${deliveryErrors.join("; ")}`,
          checkoutUrl: session.url,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("[crm-milestone-invoice] Stripe error:", err);
    return NextResponse.json({ error: "Failed to create milestone invoice" }, { status: 500 });
  }
}
