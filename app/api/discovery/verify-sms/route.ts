import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  getDiscoveryProspect,
  markDiscoveryPhoneVerified,
} from "@/lib/discovery-db";
import { sendDiscoveryIntakeEmail } from "@/lib/discovery-email";
import { readJsonBody } from "@/lib/read-json-body";
import { checkSmsVerification } from "@/lib/twilio-verify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/discovery/verify-sms");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const prospectId =
    typeof parsed.body.prospectId === "string" ? parsed.body.prospectId.trim() : "";
  const code = typeof parsed.body.code === "string" ? parsed.body.code.trim() : "";

  if (!prospectId || !code) {
    return NextResponse.json({ error: "Missing prospectId or code" }, { status: 400 });
  }

  const prospect = await getDiscoveryProspect(prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const verified = await checkSmsVerification(prospect.phone, code);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  await markDiscoveryPhoneVerified(prospectId);
  await sendDiscoveryIntakeEmail(prospect.full_name, prospect.email, prospectId);

  return NextResponse.json({ ok: true });
}
