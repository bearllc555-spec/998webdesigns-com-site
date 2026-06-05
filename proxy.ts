import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  API_RATE_LIMITS,
  clientIp,
  rateLimitResponse,
} from "@/lib/api-rate-limit";
import { checkRateLimit, pruneRateLimitStore, type RateLimitConfig } from "@/lib/rate-limit";

function resolveRateLimitConfig(path: string): RateLimitConfig | null {
  if (path in API_RATE_LIMITS) {
    return API_RATE_LIMITS[path as keyof typeof API_RATE_LIMITS];
  }
  if (path.startsWith("/api/admin/")) {
    return API_RATE_LIMITS["/api/admin/env-status"];
  }
  if (path.startsWith("/api/crm/")) {
    if (path === "/api/crm/feed") return API_RATE_LIMITS["/api/crm/feed"];
    return API_RATE_LIMITS["/api/crm/session"];
  }
  return null;
}

function shouldApplyEdgeRateLimit(req: NextRequest): boolean {
  const path = req.nextUrl.pathname;
  const config = resolveRateLimitConfig(path);
  if (!config) return false;
  if (req.method === "POST") return true;
  if (req.method === "GET" && path === "/api/admin/env-status") return true;
  if (req.method === "GET" && path === "/api/crm/feed") return true;
  return false;
}

/** Fast in-memory gate at the edge; API routes also enforce via Supabase when configured. */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!shouldApplyEdgeRateLimit(req)) {
    return NextResponse.next();
  }

  pruneRateLimitStore();

  const config = resolveRateLimitConfig(path);
  if (!config) return NextResponse.next();

  const key = `${path}:${clientIp(req)}`;
  const { allowed, retryAfterSec } = checkRateLimit(key, config);

  if (!allowed) {
    const body = rateLimitResponse(retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/leads",
    "/api/contact",
    "/api/hosting/portal/request",
    "/api/admin/:path*",
    "/api/crm/:path*",
  ],
};
