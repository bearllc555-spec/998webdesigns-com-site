import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import {
  getDiscoveryProspect,
  saveDiscoveryCloseDraft,
  saveDiscoveryIntake,
} from "@/lib/discovery-db";
import {
  buildDiscoveryCloseUrl,
  sendDiscoveryCloseEmail,
  sendDiscoveryCloseSms,
} from "@/lib/discovery-email";
import { buildMinimalDiscoveryIntake } from "@/lib/discovery-intake-stub";
import { readJsonBody } from "@/lib/read-json-body";
import { validateDiscoveryCloseDraft } from "@/lib/validate-discovery-close";

export const runtime = "nodejs";

function str(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

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

  const sendEmail = parsed.body.sendEmail !== false;
  const sendSms = parsed.body.sendSms === true;
  if (!sendEmail && !sendSms) {
    return NextResponse.json({ error: "Choose email, SMS, or both" }, { status: 400 });
  }

  const prospect = await getDiscoveryProspect(prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Discovery prospect not found" }, { status: 404 });
  }

  if (!prospect.phone_verified_at) {
    return NextResponse.json({ error: "Phone not verified yet" }, { status: 400 });
  }

  if (sendSms && !prospect.sms_consent_at) {
    return NextResponse.json({ error: "No SMS consent on file for this prospect" }, { status: 400 });
  }

  const businessName =
    str(parsed.body.businessName) ||
    prospect.intake?.businessName ||
    prospect.company_name ||
    null;

  if (!prospect.intake) {
    if (!businessName) {
      return NextResponse.json(
        { error: "Enter a business name before sending (brief not submitted yet)" },
        { status: 400 }
      );
    }
    const savedIntake = await saveDiscoveryIntake(
      prospectId,
      buildMinimalDiscoveryIntake(businessName, prospect.crm_notes)
    );
    if (!savedIntake) {
      return NextResponse.json({ error: "Could not save project details" }, { status: 500 });
    }
  }

  const draftBody = { ...parsed.body } as Record<string, unknown>;
  delete draftBody.prospectId;
  delete draftBody.sendEmail;
  delete draftBody.sendSms;
  delete draftBody.businessName;

  const validated = validateDiscoveryCloseDraft(draftBody);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const saved = await saveDiscoveryCloseDraft(prospectId, validated.data);
  if (!saved) {
    return NextResponse.json({ error: "Could not save close draft" }, { status: 500 });
  }

  const closeUrl = buildDiscoveryCloseUrl(prospectId);
  if (!closeUrl) {
    return NextResponse.json({ error: "Could not build checkout link" }, { status: 500 });
  }

  const deliveryErrors: string[] = [];

  if (sendEmail) {
    const emailed = await sendDiscoveryCloseEmail(
      prospect.full_name,
      prospect.email,
      prospectId
    );
    if (!emailed) deliveryErrors.push("email");
  }

  if (sendSms) {
    const sms = await sendDiscoveryCloseSms(prospect.phone, prospect.full_name, prospectId);
    if (!sms.ok) deliveryErrors.push(sms.error);
  }

  if (deliveryErrors.length) {
    const channels = [sendEmail && "email", sendSms && "SMS"].filter(Boolean).join(" and ");
    return NextResponse.json(
      {
        error: `Close draft saved but delivery failed (${channels}): ${deliveryErrors.join("; ")}`,
        closeUrl,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, closeUrl });
}
