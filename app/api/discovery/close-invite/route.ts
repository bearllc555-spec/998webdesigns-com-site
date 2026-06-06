import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import {
  getDiscoveryProspect,
  saveDiscoveryCloseDraft,
} from "@/lib/discovery-db";
import { sendDiscoveryCloseEmail } from "@/lib/discovery-email";
import { readJsonBody } from "@/lib/read-json-body";
import { validateDiscoveryCloseDraft } from "@/lib/validate-discovery-close";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const prospectId =
    typeof parsed.body.prospectId === "string" ? parsed.body.prospectId.trim() : "";
  if (!prospectId) {
    return NextResponse.json({ error: "Missing prospectId" }, { status: 400 });
  }

  const prospect = await getDiscoveryProspect(prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Discovery prospect not found" }, { status: 404 });
  }
  if (!prospect.intake_submitted_at || !prospect.intake) {
    return NextResponse.json({ error: "Intake not complete yet" }, { status: 400 });
  }

  const draftBody = { ...parsed.body } as Record<string, unknown>;
  delete draftBody.prospectId;
  const validated = validateDiscoveryCloseDraft(draftBody);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const saved = await saveDiscoveryCloseDraft(prospectId, validated.data);
  if (!saved) {
    return NextResponse.json({ error: "Could not save close draft" }, { status: 500 });
  }

  const emailed = await sendDiscoveryCloseEmail(
    prospect.full_name,
    prospect.email,
    prospectId
  );
  if (!emailed) {
    return NextResponse.json({ error: "Close draft saved but email failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
