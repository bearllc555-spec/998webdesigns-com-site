import { NextRequest, NextResponse } from "next/server";
import { deleteContactSubmission } from "@/lib/contact-db";
import { setCrmItemReadState } from "@/lib/crm-read-state";
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
  if (source !== "lead" && source !== "contact") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const ok =
    source === "lead"
      ? await deleteWdLead(id)
      : await deleteContactSubmission(id);

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
  if (source !== "lead" && source !== "contact") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  let body: { read?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.read !== "boolean") {
    return NextResponse.json({ error: "read (boolean) is required" }, { status: 400 });
  }

  const ok = await setCrmItemReadState(source, id, body.read);
  if (!ok) {
    return NextResponse.json({ error: "Could not update read state" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    readAt: body.read ? new Date().toISOString() : null,
  });
}
