import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { getWdLeadById } from "@/lib/leads-db";
import { listInboundSmsForWdLeadProfile } from "@/lib/inbound-sms-db";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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

  const { id } = await params;
  const lead = await getWdLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const discoveryProspectId =
    typeof lead.payload.discoveryProspectId === "string"
      ? lead.payload.discoveryProspectId
      : null;

  const messages = await listInboundSmsForWdLeadProfile(id, { discoveryProspectId });
  return NextResponse.json({ ok: true, messages });
}
