import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import { executeVoiceDemoAestheticsTool } from "@/lib/voice-demo-aesthetics/tools";
import { executeVoiceDemoPlumbingTool } from "@/lib/voice-demo-plumbing-tools";
import { executeVoiceDemoTool, type VoiceDemoToolMode } from "@/lib/voice-demo-tools";
import {
  aestheticsBrandFromVertical,
  isAestheticsVertical,
  isPlumbingVertical,
} from "@/lib/voice-demo-vertical";
import {
  readVoiceDemoSession,
  setVoiceDemoSessionCookie,
} from "@/lib/voice-demo-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/tool");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const name = typeof parsed.body.name === "string" ? parsed.body.name : "";
  const mode: VoiceDemoToolMode = parsed.body.mode === "demo" ? "demo" : "verify";
  const args =
    parsed.body.args && typeof parsed.body.args === "object"
      ? (parsed.body.args as Record<string, unknown>)
      : {};

  if (!name) {
    return NextResponse.json({ error: "Missing tool name." }, { status: 400 });
  }

  const session = readVoiceDemoSession(req);
  if (!session) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  if (mode === "demo" && !session.verified) {
    return NextResponse.json({ error: "Not verified." }, { status: 403 });
  }

  const aestheticsBrand = aestheticsBrandFromVertical(session.vertical);
  const result =
    mode === "demo" && isPlumbingVertical(session.vertical)
      ? await executeVoiceDemoPlumbingTool(session.leadId, name, args)
      : mode === "demo" && isAestheticsVertical(session.vertical) && aestheticsBrand
        ? await executeVoiceDemoAestheticsTool(aestheticsBrand, session.leadId, name, args)
        : await executeVoiceDemoTool(session.leadId, mode, name, args);

  const res = NextResponse.json({ ok: true, result });
  if (name === "verify_code" && result.verified === true) {
    setVoiceDemoSessionCookie(res, session.leadId, true, session.vertical);
  } else if (mode === "demo") {
    setVoiceDemoSessionCookie(res, session.leadId, session.verified, session.vertical);
  }
  return res;
}
