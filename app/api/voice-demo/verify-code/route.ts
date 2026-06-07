import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import { getVoiceDemoLead } from "@/lib/voice-demo-db";
import { executeVoiceDemoTool } from "@/lib/voice-demo-tools";
import {
  readVoiceDemoSession,
  setVoiceDemoSessionCookie,
} from "@/lib/voice-demo-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/verify-code");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const session = readVoiceDemoSession(req);
  if (!session) {
    return NextResponse.json({ error: "Session expired. Start again." }, { status: 401 });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const code = typeof parsed.body.code === "string" ? parsed.body.code : "";
  if (!code.trim()) {
    return NextResponse.json({ error: "Enter your verification code." }, { status: 400 });
  }

  const row = await getVoiceDemoLead(session.leadId);
  if (!row) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const result = await executeVoiceDemoTool(session.leadId, "verify", "verify_code", { code });
  if (!result.verified) {
    return NextResponse.json(
      { error: (result.error as string) ?? "Invalid code.", attemptsRemaining: result.attemptsRemaining },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true, verified: true });
  setVoiceDemoSessionCookie(res, session.leadId, true);
  return res;
}
