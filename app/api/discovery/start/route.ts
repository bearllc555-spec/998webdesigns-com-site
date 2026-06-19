import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { insertDiscoveryProspect } from "@/lib/discovery-db";
import { readJsonBody } from "@/lib/read-json-body";
import { startSmsVerification } from "@/lib/twilio-verify";
import { validateDiscoveryStartPayload } from "@/lib/validate-discovery-start";

export const runtime = "nodejs";

type StartPayload = Record<string, unknown> & { website?: string };

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/discovery/start");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    const status = parsed.error === "Request body too large" ? 413 : 400;
    return NextResponse.json({ error: parsed.error }, { status });
  }

  const body = parsed.body as StartPayload;
  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  delete body.website;

  const validated = validateDiscoveryStartPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const inserted = await insertDiscoveryProspect({
    full_name: validated.data.fullName,
    company_name: validated.data.companyName,
    email: validated.data.email.toLowerCase(),
    phone: validated.data.phoneE164,
    goal: validated.data.goal || null,
    sms_consent_at: new Date().toISOString(),
    ip,
  });

  if (!inserted.ok) {
    return NextResponse.json(
      { error: "Could not save your request. Try again or contact us." },
      { status: 503 }
    );
  }

  const sms = await startSmsVerification(validated.data.phoneE164);
  if (!sms.ok) {
    return NextResponse.json({ error: sms.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true, prospectId: inserted.id });
}
