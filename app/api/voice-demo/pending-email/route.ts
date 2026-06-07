import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import { isValidEmail } from "@/lib/validate-email";
import { setPendingEmailCookie } from "@/lib/voice-demo-pending-email";

export const runtime = "nodejs";

type Body = {
  email?: string;
  website?: string;
};

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/start");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.body as Body;
  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, email });
  if (!setPendingEmailCookie(res, email)) {
    return NextResponse.json({ error: "Could not start session. Try again." }, { status: 503 });
  }
  return res;
}
