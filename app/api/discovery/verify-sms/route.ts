import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  getDiscoveryProspect,
  markDiscoveryPhoneVerified,
  saveDiscoveryIntake,
} from "@/lib/discovery-db";
import { sendDiscoveryScheduleEmail, buildDiscoveryScheduleUrl } from "@/lib/discovery-email";
import { buildMinimalDiscoveryIntake } from "@/lib/discovery-intake-stub";
import { notifyCrmActivity } from "@/lib/crm-notify";
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

  if (!prospect.intake_submitted_at) {
    await saveDiscoveryIntake(
      prospectId,
      buildMinimalDiscoveryIntake(prospect.company_name ?? "", prospect.goal)
    );
  }

  await sendDiscoveryScheduleEmail(prospect.full_name, prospect.email, prospectId);

  await notifyCrmActivity({
    kind: "discovery_phone_verified",
    businessName: prospect.company_name ?? "",
    fullName: prospect.full_name,
    email: prospect.email,
    phone: prospect.phone,
    status: "phone_verified",
    message: prospect.goal ?? undefined,
  });

  const scheduleUrl = buildDiscoveryScheduleUrl(prospectId);

  return NextResponse.json({ ok: true, scheduleUrl: scheduleUrl ?? undefined });
}
