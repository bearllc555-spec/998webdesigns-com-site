import { NextRequest, NextResponse } from "next/server";
import { crmAdminSecret } from "@/lib/crm-admin-secret";
import {
  CRM_SESSION_COOKIE,
  crmSessionCookieOptions,
  crmSessionToken,
  isCrmRequestAuthorized,
} from "@/lib/crm-session";
import { verifyBearerSecret } from "@/lib/admin-auth";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/crm/session");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const secret = crmAdminSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "CRM_ADMIN_SECRET or BALANCE_CAPTURE_SECRET not configured" },
      { status: 503 }
    );
  }

  let token = "";
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    try {
      const body = (await req.json()) as { secret?: string };
      token = typeof body.secret === "string" ? body.secret.trim() : "";
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (!verifyBearerSecret(`Bearer ${token}`, secret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CRM_SESSION_COOKIE, crmSessionToken(secret), crmSessionCookieOptions());
  return res;
}

export async function DELETE(req: NextRequest) {
  if (!isCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CRM_SESSION_COOKIE, "", { ...crmSessionCookieOptions(0), maxAge: 0 });
  return res;
}
