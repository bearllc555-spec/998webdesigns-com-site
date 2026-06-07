import { NextRequest, NextResponse } from "next/server";
import { getVoiceDemoLead } from "@/lib/voice-demo-db";
import { geminiApiKey } from "@/lib/voice-demo-live-token";
import { readVoiceDemoSession } from "@/lib/voice-demo-session";
import { twilioMessagingConfigured } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = readVoiceDemoSession(req);
  if (!session) {
    return NextResponse.json({
      ok: true,
      active: false,
      configured: Boolean(geminiApiKey()),
    });
  }

  const row = await getVoiceDemoLead(session.leadId);
  if (!row) {
    return NextResponse.json({
      ok: true,
      active: false,
      configured: Boolean(geminiApiKey()),
    });
  }

  const verified = Boolean(row.email_verified_at || row.phone_verified_at);

  return NextResponse.json({
    ok: true,
    active: true,
    leadId: row.id,
    verified: session.verified && verified,
    channel: row.primary_channel,
    destination: row.primary_channel === "email" ? row.email : row.phone,
    fullName: row.full_name,
    phoneOnFile: Boolean(row.phone),
    configured: Boolean(geminiApiKey()),
    promoSent: Boolean(row.promo_sent_at),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    smsConfigured: twilioMessagingConfigured(),
  });
}
