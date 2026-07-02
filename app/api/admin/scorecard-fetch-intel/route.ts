import { NextRequest, NextResponse } from "next/server";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceAdminRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { fetchScorecardInternalIntelByToken } from "@/lib/scorecard/fetch-internal-intel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST - fetch Awwwards + WebsiteRating intel via VPS. Bearer: BALANCE_CAPTURE_SECRET. Body: { token } */
export async function POST(req: NextRequest) {
  const rate = await enforceAdminRateLimit(req, "/api/admin/env-status");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = process.env.BALANCE_CAPTURE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "BALANCE_CAPTURE_SECRET not configured" }, { status: 503 });
  }

  if (!verifyBearerSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "token is required" }, { status: 422 });
  }

  const result = await fetchScorecardInternalIntelByToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.detail }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    domain: result.domain,
    internalIntel: result.internalIntel,
  });
}
