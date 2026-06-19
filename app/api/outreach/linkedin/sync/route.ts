import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { upsertLinkedinProspect, type LinkedinProspectSyncInput } from "@/lib/linkedin-prospect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function syncSecret(): string | null {
  return (
    process.env.OPENOUTREACH_SYNC_SECRET?.trim() ||
    process.env.BALANCE_CAPTURE_SECRET?.trim() ||
    null
  );
}

type SyncBody = {
  prospects?: LinkedinProspectSyncInput[];
};

function normalizeInput(raw: unknown): LinkedinProspectSyncInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const openoutreachLeadId = Number(o.openoutreachLeadId ?? o.openoutreach_lead_id);
  const email = typeof o.email === "string" ? o.email : "";
  const publicIdentifier =
    typeof o.publicIdentifier === "string"
      ? o.publicIdentifier
      : typeof o.public_identifier === "string"
        ? o.public_identifier
        : "";
  const linkedinUrl =
    typeof o.linkedinUrl === "string"
      ? o.linkedinUrl
      : typeof o.linkedin_url === "string"
        ? o.linkedin_url
        : "";

  if (!Number.isFinite(openoutreachLeadId) || !email || !publicIdentifier || !linkedinUrl) {
    return null;
  }

  return {
    openoutreachLeadId,
    openoutreachDealId:
      o.openoutreachDealId != null
        ? Number(o.openoutreachDealId)
        : o.openoutreach_deal_id != null
          ? Number(o.openoutreach_deal_id)
          : null,
    publicIdentifier,
    linkedinUrl,
    email,
    emailSource:
      typeof o.emailSource === "string"
        ? o.emailSource
        : typeof o.email_source === "string"
          ? o.email_source
          : "chat_message",
    emailCapturedAt:
      typeof o.emailCapturedAt === "string"
        ? o.emailCapturedAt
        : typeof o.email_captured_at === "string"
          ? o.email_captured_at
          : null,
    emailCaptureSnippet:
      typeof o.emailCaptureSnippet === "string"
        ? o.emailCaptureSnippet
        : typeof o.email_capture_snippet === "string"
          ? o.email_capture_snippet
          : null,
    fullName:
      typeof o.fullName === "string"
        ? o.fullName
        : typeof o.full_name === "string"
          ? o.full_name
          : null,
    companyName:
      typeof o.companyName === "string"
        ? o.companyName
        : typeof o.company_name === "string"
          ? o.company_name
          : null,
    linkedinState:
      typeof o.linkedinState === "string"
        ? o.linkedinState
        : typeof o.linkedin_state === "string"
          ? o.linkedin_state
          : null,
    campaignName:
      typeof o.campaignName === "string"
        ? o.campaignName
        : typeof o.campaign_name === "string"
          ? o.campaign_name
          : null,
    chatSummary:
      o.chatSummary && typeof o.chatSummary === "object"
        ? (o.chatSummary as Record<string, unknown>)
        : o.chat_summary && typeof o.chat_summary === "object"
          ? (o.chat_summary as Record<string, unknown>)
          : null,
    profileSummary:
      o.profileSummary && typeof o.profileSummary === "object"
        ? (o.profileSummary as Record<string, unknown>)
        : o.profile_summary && typeof o.profile_summary === "object"
          ? (o.profile_summary as Record<string, unknown>)
          : null,
  };
}

/** POST batch upsert from OpenOutreach sync script. Bearer: OPENOUTREACH_SYNC_SECRET or BALANCE_CAPTURE_SECRET. */
export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/outreach/linkedin/sync");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = syncSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "OPENOUTREACH_SYNC_SECRET or BALANCE_CAPTURE_SECRET not configured" },
      { status: 503 }
    );
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncBody;
  try {
    body = (await req.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawList = Array.isArray(body.prospects) ? body.prospects : [];
  if (!rawList.length) {
    return NextResponse.json({ error: "prospects array required" }, { status: 400 });
  }

  const results: Array<{
    openoutreachLeadId: number;
    ok: boolean;
    id?: string;
    created?: boolean;
    enrolled?: boolean;
    error?: string;
  }> = [];

  for (const raw of rawList) {
    const input = normalizeInput(raw);
    if (!input) {
      results.push({ openoutreachLeadId: -1, ok: false, error: "Invalid prospect payload" });
      continue;
    }

    const result = await upsertLinkedinProspect(input);
    if (!result.ok) {
      results.push({
        openoutreachLeadId: input.openoutreachLeadId,
        ok: false,
        error: result.reason,
      });
      continue;
    }

    results.push({
      openoutreachLeadId: input.openoutreachLeadId,
      ok: true,
      id: result.row.id,
      created: result.created,
      enrolled: result.enrolled,
    });
  }

  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: okCount > 0,
    synced: okCount,
    total: results.length,
    results,
  });
}
