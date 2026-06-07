import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  API_RATE_LIMITS,
  clientIp,
  rateLimitResponse,
} from "@/lib/api-rate-limit";
import { crmAdminSecret } from "@/lib/crm-admin-secret";
import { CRM_SESSION_COOKIE, verifyCrmSessionValue } from "@/lib/crm-session";
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
  if (path.startsWith("/api/discovery/")) {
    return API_RATE_LIMITS["/api/discovery/start"];
  }
  if (path.startsWith("/api/voice-demo/")) {
    return API_RATE_LIMITS["/api/voice-demo/start"];
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

function tempLoginRedirect(req: NextRequest): NextResponse {
  const path = req.nextUrl.pathname;
  const next =
    path.startsWith("/") && !path.startsWith("//") ? path + req.nextUrl.search : "/temp";
  const loginUrl = new URL("/crm/login", req.url);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

/** /temp on production requires the same CRM session as /crm (CRM_ADMIN_SECRET). */
function requireCrmForTempInProduction(req: NextRequest): NextResponse | null {
  if (process.env.VERCEL_ENV !== "production") return null;
  const path = req.nextUrl.pathname;
  if (path !== "/temp" && !path.startsWith("/temp/")) return null;

  const secret = crmAdminSecret();
  if (!secret) {
    return new NextResponse("CRM auth not configured", { status: 503 });
  }

  const cookie = req.cookies.get(CRM_SESSION_COOKIE)?.value;
  if (verifyCrmSessionValue(cookie, secret)) return null;

  return tempLoginRedirect(req);
}

/** Fast in-memory gate at the edge; API routes also enforce via Supabase when configured. */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const tempGate = requireCrmForTempInProduction(req);
  if (tempGate) return tempGate;

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
    "/temp",
    "/temp/:path*",
    "/api/leads",
    "/api/contact",
    "/api/discovery/:path*",
    "/api/hosting/portal/request",
    "/api/admin/:path*",
    "/api/crm/:path*",
  ],
};
