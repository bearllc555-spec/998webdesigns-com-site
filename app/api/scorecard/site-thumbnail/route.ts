import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { fetchSiteThumbnailByToken } from "@/lib/scorecard/site-thumbnail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Poll for site_screenshot_url after VPS backfill (report page auto-loads thumbnail). */
export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/scorecard/site-thumbnail");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const url = await fetchSiteThumbnailByToken(token);
  return NextResponse.json({ url });
}
