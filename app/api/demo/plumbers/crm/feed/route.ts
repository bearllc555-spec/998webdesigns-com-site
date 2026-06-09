import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { getPlumbingDemoCrmSeedItems } from "@/lib/plumbing-demo-crm-seed";
import { isPlumbingDemoCrmRequestAuthorized } from "@/lib/plumbing-demo-crm-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/demo/plumbers/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isPlumbingDemoCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    100,
    Math.max(10, Number(req.nextUrl.searchParams.get("limit") ?? "80") || 80)
  );

  const items = getPlumbingDemoCrmSeedItems().slice(0, limit);
  return NextResponse.json({ items, error: null });
}
