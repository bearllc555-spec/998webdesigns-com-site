import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { getAestheticsCrmSnapshot } from "@/lib/aesthetics-demo-crm/store";
import { isAestheticsDemoCrmRequestAuthorized } from "@/lib/aesthetics-demo-crm/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/demo/wellness/crm/feed");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  if (!isAestheticsDemoCrmRequestAuthorized("wellness", req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ snapshot: getAestheticsCrmSnapshot("wellness"), error: null });
}
