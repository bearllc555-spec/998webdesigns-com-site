import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  getDiscoveryProspect,
  markDiscoveryEmailVerified,
  saveDiscoveryIntake,
} from "@/lib/discovery-db";
import { verifyDiscoveryToken } from "@/lib/discovery-token";
import { readJsonBody } from "@/lib/read-json-body";
import { validateDiscoveryIntakePayload } from "@/lib/validate-discovery-intake";
import { notifyCrmActivity } from "@/lib/crm-notify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const payload = verifyDiscoveryToken(token, "intake");
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const prospect = await getDiscoveryProspect(payload.prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!prospect.email_verified_at) {
    await markDiscoveryEmailVerified(payload.prospectId);
  }

  return NextResponse.json({
    ok: true,
    fullName: prospect.full_name,
    email: prospect.email,
    companyName: prospect.company_name ?? "",
    goal: prospect.goal,
    intakeSubmitted: Boolean(prospect.intake_submitted_at),
  });
}

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/discovery/intake");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = typeof parsed.body.token === "string" ? parsed.body.token.trim() : "";
  const payload = verifyDiscoveryToken(token, "intake");
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const prospect = await getDiscoveryProspect(payload.prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const intakeBody = { ...parsed.body } as Record<string, unknown>;
  delete intakeBody.token;

  const validated = validateDiscoveryIntakePayload(intakeBody);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const saved = await saveDiscoveryIntake(payload.prospectId, validated.data);
  if (!saved) {
    return NextResponse.json({ error: "Could not save intake" }, { status: 500 });
  }

  await notifyCrmActivity({
    kind: "discovery_intake",
    businessName: validated.data.businessName || prospect.company_name || "",
    fullName: prospect.full_name,
    email: prospect.email,
    phone: prospect.phone,
    status: "brief_submitted",
  });

  return NextResponse.json({ ok: true });
}
