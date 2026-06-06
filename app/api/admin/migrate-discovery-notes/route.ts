import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { runDiscoveryCrmNotesMigration } from "@/lib/pg-migrate-discovery-notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — add discovery_prospects.crm_notes (idempotent). Bearer: BALANCE_CAPTURE_SECRET. */
export async function POST(req: NextRequest) {
  const rate = await enforceAdminRateLimit(req, "/api/admin/env-status");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = process.env.BALANCE_CAPTURE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "BALANCE_CAPTURE_SECRET is not configured on the server" },
      { status: 503 }
    );
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDiscoveryCrmNotesMigration();
  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true, via: result.via });
}
