import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { checkoutOrigin } from "@/lib/checkout-origin";
import { readJsonBody } from "@/lib/read-json-body";
import { warnIfProductionStripeTestMode } from "@/lib/stripe-env";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { verifySiteforgeToken } from "@/lib/siteforge-token";
import { siteforgeApplyDecision, siteforgeGetJob } from "@/lib/siteforge-api";
import { buildSiteforgeCheckoutParams } from "@/lib/siteforge-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/siteforge/checkout");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json(
      { error: body.error },
      { status: body.status, headers: body.headers }
    );
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = typeof parsed.body.token === "string" ? parsed.body.token.trim() : "";
  const payload = verifySiteforgeToken(token, "approve");
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  let bundle;
  try {
    bundle = await siteforgeGetJob(payload.jobId);
  } catch (err) {
    console.error("[siteforge/checkout] get job", err);
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { job, lead } = bundle;
  if (!["mockup_ready", "changes_requested", "approved"].includes(job.status)) {
    return NextResponse.json(
      { error: `This mockup can’t be approved (status: ${job.status})` },
      { status: 409 }
    );
  }

  try {
    if (job.status !== "approved") {
      await siteforgeApplyDecision(job.id, "approve");
    }
  } catch (err) {
    console.error("[siteforge/checkout] apply decision", err);
    return NextResponse.json({ error: "Could not record approval" }, { status: 500 });
  }

  try {
    warnIfProductionStripeTestMode("siteforge-checkout");
    const origin = checkoutOrigin(req);
    const session = await stripe.checkout.sessions.create(
      buildSiteforgeCheckoutParams({
        origin,
        jobId: job.id,
        email: lead.email,
        fullName: lead.full_name || lead.business_name || "Client",
        businessName: lead.business_name || lead.full_name || "Business",
        previewUrl: job.preview_url,
        token,
      })
    );

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[siteforge/checkout] stripe", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
