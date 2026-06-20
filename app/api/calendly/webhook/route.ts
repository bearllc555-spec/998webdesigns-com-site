import { NextRequest, NextResponse } from "next/server";
import {
  extractCalendlyInviteePayload,
  parseCalendlyWebhookBody,
  verifyCalendlyWebhookSignature,
} from "@/lib/calendly-webhook";
import { cancelDiscoveryCallBooking, recordDiscoveryCallBooking } from "@/lib/discovery-call-booking";

export const runtime = "nodejs";

/** Calendly webhook: invitee.created / invitee.canceled for discovery scheduling. */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("Calendly-Webhook-Signature");

  if (!verifyCalendlyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const envelope = parseCalendlyWebhookBody(rawBody);
  if (!envelope?.event || !envelope.payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const invitee = extractCalendlyInviteePayload(envelope.payload);
  if (!invitee) {
    return NextResponse.json({ ok: true, skipped: "no_invitee" });
  }

  if (envelope.event === "invitee.created") {
    const result = await recordDiscoveryCallBooking({
      prospectId: invitee.prospectId,
      email: invitee.email,
      eventStartAt: invitee.eventStartAt,
      inviteeUri: invitee.uri,
    });
    return NextResponse.json({ ok: result.ok, prospectId: result.prospectId ?? null });
  }

  if (envelope.event === "invitee.canceled") {
    const ok = await cancelDiscoveryCallBooking({
      prospectId: invitee.prospectId,
      email: invitee.email,
    });
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ ok: true, skipped: envelope.event });
}
