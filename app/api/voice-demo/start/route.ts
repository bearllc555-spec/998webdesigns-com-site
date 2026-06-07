import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse, clientIp } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import { isValidEmail } from "@/lib/validate-email";
import { startEmailVerificationLead } from "@/lib/voice-demo-start-email";
import { setVoiceDemoSessionCookie } from "@/lib/voice-demo-session";

export const runtime = "nodejs";

type StartBody = {
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

  const body = parsed.body as StartBody;
  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const started = await startEmailVerificationLead(email, clientIp(req));
  if (!started.ok) {
    return NextResponse.json({ error: started.error }, { status: 503 });
  }

  const res = NextResponse.json({
    ok: true,
    leadId: started.leadId,
    channel: "email",
    destination: started.destination,
  });
  setVoiceDemoSessionCookie(res, started.leadId, false);
  return res;
}
