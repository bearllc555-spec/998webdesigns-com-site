import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import {
  appendVoiceDemoOpsEvent,
  buildVoiceDemoOpsEvent,
} from "@/lib/voice-demo-ops";
import { finalizePlumbingBookingIfReady } from "@/lib/voice-demo-plumbing-tools";
import { isPlumbingVertical } from "@/lib/voice-demo-vertical";
import { readVoiceDemoSession } from "@/lib/voice-demo-session";

export const runtime = "nodejs";

/** Safety net before hangup - book + send confirmation if all fields are on file. */
export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/plumbing/finalize-booking");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const session = readVoiceDemoSession(req);
  if (!session || !isPlumbingVertical(session.vertical)) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const result = await finalizePlumbingBookingIfReady(session.leadId);

  void appendVoiceDemoOpsEvent(
    session.leadId,
    buildVoiceDemoOpsEvent(
      "plumbing_booking_finalize",
      result.ok && result.booked
        ? result.alreadyBooked
          ? "Finalize: appointment already booked"
          : "Finalize: appointment booked + comms scheduled"
        : result.ok && !result.booked
          ? `Finalize: not ready (${result.missing.join(", ")})`
          : `Finalize failed: ${result.error}`,
      {
        booked: result.ok && result.booked,
        alreadyBooked: result.ok && result.booked ? result.alreadyBooked : undefined,
        missing: result.ok && !result.booked ? result.missing : undefined,
        error: !result.ok ? result.error : undefined,
      }
    )
  );

  return NextResponse.json({ ok: true, result });
}
