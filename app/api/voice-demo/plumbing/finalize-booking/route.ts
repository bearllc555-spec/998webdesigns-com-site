import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import {
  appendVoiceDemoOpsEvent,
  buildVoiceDemoOpsEvent,
} from "@/lib/voice-demo-ops";
import type { PlumbingTranscriptLine } from "@/lib/voice-demo-plumbing-transcript-book";
import { finalizePlumbingBookingWithTranscript } from "@/lib/voice-demo-plumbing-tools";
import { isPlumbingVertical } from "@/lib/voice-demo-vertical";
import { readVoiceDemoSession } from "@/lib/voice-demo-session";

export const runtime = "nodejs";

function parseTranscript(body: Record<string, unknown>): PlumbingTranscriptLine[] | undefined {
  if (!Array.isArray(body.transcript)) return undefined;
  const lines: PlumbingTranscriptLine[] = [];
  for (const item of body.transcript) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const role = row.role === "user" || row.role === "assistant" ? row.role : null;
    const text = typeof row.text === "string" ? row.text.trim() : "";
    if (role && text) lines.push({ role, text });
  }
  return lines.length > 0 ? lines : undefined;
}

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

  const parsed = await readJsonBody(req);
  const transcript =
    parsed.ok && parsed.body && typeof parsed.body === "object"
      ? parseTranscript(parsed.body as Record<string, unknown>)
      : undefined;

  const result = await finalizePlumbingBookingWithTranscript(session.leadId, transcript);

  void appendVoiceDemoOpsEvent(
    session.leadId,
    buildVoiceDemoOpsEvent(
      "plumbing_booking_finalize",
      result.ok && result.booked
        ? result.alreadyBooked
          ? "Finalize: appointment already booked"
          : `Finalize: appointment booked via ${result.source ?? "db"} + comms scheduled`
        : result.ok && !result.booked
          ? `Finalize: not ready (${result.missing.join(", ")})`
          : `Finalize failed: ${result.error}`,
      {
        booked: result.ok && result.booked,
        alreadyBooked: result.ok && result.booked ? result.alreadyBooked : undefined,
        missing: result.ok && !result.booked ? result.missing : undefined,
        error: !result.ok ? result.error : undefined,
        source: result.source,
        transcriptLines: transcript?.length ?? 0,
      }
    )
  );

  return NextResponse.json({ ok: true, result });
}
