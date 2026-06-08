import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { isCrmRequestAuthorized } from "@/lib/crm-session";
import { fetchPlumbingCrmFeed } from "@/lib/plumbing-crm-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/demo/plumbers/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    100,
    Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "50") || 50)
  );

  const { items, error } = await fetchPlumbingCrmFeed(limit);
  return NextResponse.json({ items, error: error ?? null });
}
