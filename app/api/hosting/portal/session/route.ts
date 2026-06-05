import { NextRequest, NextResponse } from "next/server";
import { findHostingPortalLeadByEmail } from "@/lib/hosting-portal-leads";
import { hostingPortalOrigin } from "@/lib/hosting-portal-origin";
import { createHostingBillingPortalSession } from "@/lib/hosting-portal-session";
import { verifyHostingPortalToken } from "@/lib/hosting-portal-token";

export const runtime = "nodejs";

function manageUrl(req: NextRequest, query?: string): string {
  const origin = hostingPortalOrigin(req);
  return query ? `${origin}/hosting/manage?${query}` : `${origin}/hosting/manage`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(manageUrl(req, "error=missing"));
  }

  const payload = verifyHostingPortalToken(token);
  if (!payload) {
    return NextResponse.redirect(manageUrl(req, "error=expired"));
  }

  const lead = await findHostingPortalLeadByEmail(payload.email);
  if (
    !lead ||
    lead.stripe_customer_id !== payload.customerId
  ) {
    return NextResponse.redirect(manageUrl(req, "error=ineligible"));
  }

  try {
    const portalUrl = await createHostingBillingPortalSession(
      payload.customerId,
      manageUrl(req, "portal=done")
    );
    if (!portalUrl) {
      return NextResponse.redirect(manageUrl(req, "error=stripe"));
    }
    return NextResponse.redirect(portalUrl);
  } catch (err) {
    console.error("[hosting-portal] Stripe billing portal session failed:", err);
    return NextResponse.redirect(manageUrl(req, "error=stripe"));
  }
}
