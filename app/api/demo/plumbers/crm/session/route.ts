import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  PLUMBING_DEMO_CRM_SESSION_COOKIE,
  isPlumbingDemoCrmRequestAuthorized,
  isValidPlumbingDemoCrmLogin,
  plumbingDemoCrmSessionCookieOptions,
  plumbingDemoCrmSessionToken,
} from "@/lib/plumbing-demo-crm-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/demo/plumbers/crm/session");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  let email = "";
  let password = "";
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = typeof body.email === "string" ? body.email : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidPlumbingDemoCrmLogin(email, password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    PLUMBING_DEMO_CRM_SESSION_COOKIE,
    plumbingDemoCrmSessionToken(),
    plumbingDemoCrmSessionCookieOptions()
  );
  return res;
}

export async function DELETE(req: NextRequest) {
  if (!isPlumbingDemoCrmRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PLUMBING_DEMO_CRM_SESSION_COOKIE, "", {
    ...plumbingDemoCrmSessionCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
