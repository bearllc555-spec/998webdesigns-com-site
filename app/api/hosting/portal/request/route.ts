import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { findHostingPortalLeadByEmail } from "@/lib/hosting-portal-leads";
import { sendHostingPortalMagicLinkEmail } from "@/lib/hosting-portal-email";
import { hostingPortalOrigin } from "@/lib/hosting-portal-origin";
import { createHostingPortalToken } from "@/lib/hosting-portal-token";
import { hostingPortalSecret } from "@/lib/hosting-portal-secret";
import { readJsonBody } from "@/lib/read-json-body";
import { isValidEmail } from "@/lib/validate-email";

export const runtime = "nodejs";

const GENERIC_OK = {
  ok: true,
  message:
    "If we find an active month-to-month hosting account for that email, we sent a secure link. Check your inbox (and spam) in the next few minutes.",
};

type RequestPayload = {
  email?: string;
  website?: string;
};

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/hosting/portal/request");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    const status = parsed.error === "Request body too large" ? 413 : 400;
    return NextResponse.json({ error: parsed.error }, { status });
  }

  const body = parsed.body as RequestPayload;

  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json(GENERIC_OK);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!hostingPortalSecret()) {
    console.error("[hosting-portal] BALANCE_CAPTURE_SECRET not configured");
    return NextResponse.json(
      { error: "Hosting portal is temporarily unavailable. Email hello@998webdesigns.com." },
      { status: 503 }
    );
  }

  const lead = await findHostingPortalLeadByEmail(email);
  if (lead) {
    const token = createHostingPortalToken(lead.email, lead.stripe_customer_id);
    if (token) {
      const origin = hostingPortalOrigin(req);
      const magicLinkUrl = `${origin}/api/hosting/portal/session?token=${encodeURIComponent(token)}`;
      const sent = await sendHostingPortalMagicLinkEmail(lead.email, magicLinkUrl);
      if (!sent) {
        console.warn("[hosting-portal] eligible lead but email not sent:", lead.id);
      }
    }
  }

  return NextResponse.json(GENERIC_OK);
}
