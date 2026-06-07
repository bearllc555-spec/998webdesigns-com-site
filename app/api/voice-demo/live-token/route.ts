import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { createVoiceDemoLiveToken } from "@/lib/voice-demo-live-token";
import { readVoiceDemoSession } from "@/lib/voice-demo-session";
import type { VoiceDemoToolMode } from "@/lib/voice-demo-tools";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/live-token");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  let mode: VoiceDemoToolMode = "verify";
  try {
    const body = (await req.json()) as { mode?: string };
    if (body.mode === "demo") mode = "demo";
  } catch {
    /* default verify */
  }

  const session = readVoiceDemoSession(req);
  if (!session) {
    return NextResponse.json({ error: "Session expired. Start again." }, { status: 401 });
  }

  if (mode === "demo" && !session.verified) {
    return NextResponse.json({ error: "Verify your code first." }, { status: 403 });
  }

  const token = await createVoiceDemoLiveToken(session.leadId, mode);
  if (!token.ok) {
    return NextResponse.json({ error: token.error }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    token: token.token,
    model: token.model,
    mode,
  });
}
