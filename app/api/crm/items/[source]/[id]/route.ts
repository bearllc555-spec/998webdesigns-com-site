import { NextRequest, NextResponse } from "next/server";
import { deleteContactSubmission } from "@/lib/contact-db";
import {
  isCrmInboxFlag,
  setCrmItemInboxFlag,
  type CrmInboxFlag,
} from "@/lib/crm-inbox-flag";
import { setCrmItemReadState } from "@/lib/crm-read-state";
import { deleteDiscoveryProspect } from "@/lib/discovery-db";
import { deleteWdLead } from "@/lib/leads-db";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ source: string; id: string }> }
) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source, id } = await params;
  if (source !== "lead" && source !== "contact" && source !== "discovery") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const ok =
    source === "lead"
      ? await deleteWdLead(id)
      : source === "contact"
        ? await deleteContactSubmission(id)
        : await deleteDiscoveryProspect(id);

  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ source: string; id: string }> }
) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source, id } = await params;
  if (source !== "lead" && source !== "contact" && source !== "discovery") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  let body: { read?: boolean; flag?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hasRead = typeof body.read === "boolean";
  const hasFlag = Object.prototype.hasOwnProperty.call(body, "flag");

  if (!hasRead && !hasFlag) {
    return NextResponse.json(
      { error: "Provide read (boolean) and/or flag (null | star | check | alert)" },
      { status: 400 }
    );
  }

  if (hasFlag && body.flag !== null && !isCrmInboxFlag(body.flag)) {
    return NextResponse.json({ error: "Invalid flag value" }, { status: 400 });
  }

  const response: { ok: true; readAt?: string | null; flag?: string | null } = {
    ok: true,
  };

  if (hasRead) {
    const ok = await setCrmItemReadState(source, id, body.read as boolean);
    if (!ok) {
      return NextResponse.json({ error: "Could not update read state" }, { status: 500 });
    }
    response.readAt = body.read ? new Date().toISOString() : null;
  }

  if (hasFlag) {
    const flag: CrmInboxFlag | null =
      body.flag === null ? null : (body.flag as CrmInboxFlag);
    const ok = await setCrmItemInboxFlag(source, id, flag);
    if (!ok) {
      return NextResponse.json({ error: "Could not update flag" }, { status: 500 });
    }
    response.flag = flag;
  }

  return NextResponse.json(response);
}
