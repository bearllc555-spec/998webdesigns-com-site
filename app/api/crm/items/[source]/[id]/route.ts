import { NextRequest, NextResponse } from "next/server";
import { deleteContactSubmission } from "@/lib/contact-db";
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
