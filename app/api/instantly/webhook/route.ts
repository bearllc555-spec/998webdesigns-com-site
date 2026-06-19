import { NextRequest, NextResponse } from "next/server";
import { applyInstantlyWebhookEvent } from "@/lib/linkedin-prospect";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST Instantly webhook events -> linkedin_prospects status updates. */
export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/instantly/webhook");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType =
    (typeof payload.event_type === "string" && payload.event_type) ||
    (typeof payload.eventType === "string" && payload.eventType) ||
    (typeof payload.type === "string" && payload.type) ||
    "";

  if (!eventType) {
    return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
  }

  const leadObj =
    payload.lead && typeof payload.lead === "object"
      ? (payload.lead as Record<string, unknown>)
      : null;

  const email =
    (typeof payload.email === "string" && payload.email) ||
    (leadObj && typeof leadObj.email === "string" ? leadObj.email : null);

  const leadId =
    (typeof payload.lead_id === "string" && payload.lead_id) ||
    (leadObj && typeof leadObj.id === "string" ? leadObj.id : null);

  const result = await applyInstantlyWebhookEvent({
    eventType,
    email,
    leadId,
    payload,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.detail ?? "Webhook failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: result.updated });
}
