import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { appendVoiceDemoOpsEvent, coerceVoiceDemoOpsInput } from "@/lib/voice-demo-ops";
import { readJsonBody } from "@/lib/read-json-body";
import { readVoiceDemoSession } from "@/lib/voice-demo-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/ops-event");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const session = readVoiceDemoSession(req);
  if (!session?.verified) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const event = coerceVoiceDemoOpsInput(parsed.body);
  if (!event) {
    return NextResponse.json({ error: "Invalid ops event." }, { status: 400 });
  }

  const ok = await appendVoiceDemoOpsEvent(session.leadId, event);
  if (!ok) {
    return NextResponse.json({ error: "Could not persist ops event." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
