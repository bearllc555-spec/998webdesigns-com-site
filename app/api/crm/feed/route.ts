import { NextRequest, NextResponse } from "next/server";
import { fetchCrmFeed } from "@/lib/crm-feed";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    100,
    Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "80") || 80)
  );

  const { items, error } = await fetchCrmFeed(limit);
  return NextResponse.json({ items, error: error ?? null });
}
