import { NextRequest, NextResponse } from "next/server";
import { recordDiscoveryCallBooking } from "@/lib/discovery-call-booking";
import { getDiscoveryProspect } from "@/lib/discovery-db";
import { verifyDiscoveryScheduleToken } from "@/lib/discovery-token";
import { readJsonBody } from "@/lib/read-json-body";

export const runtime = "nodejs";

/** Client callback when Calendly inline widget fires event_scheduled (before webhook lands). */
export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const token = typeof parsed.body.token === "string" ? parsed.body.token.trim() : "";
  const eventStartAt =
    typeof parsed.body.eventStartAt === "string" ? parsed.body.eventStartAt.trim() : null;
  const inviteeUri =
    typeof parsed.body.inviteeUri === "string" ? parsed.body.inviteeUri.trim() : null;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyDiscoveryScheduleToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }

  const prospect = await getDiscoveryProspect(payload.prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const result = await recordDiscoveryCallBooking({
    prospectId: prospect.id,
    email: prospect.email,
    eventStartAt,
    inviteeUri,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Could not record booking" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
