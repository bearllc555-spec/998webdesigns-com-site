import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/api-rate-limit";
import { getVoiceDemoLead } from "@/lib/voice-demo-db";
import { getVoiceDemoDailyQuotaStatus } from "@/lib/voice-demo-daily-quota";
import { geminiApiKey } from "@/lib/voice-demo-live-token";
import { getLatestPlumbingJobForLead } from "@/lib/voice-demo-plumbing-db";
import { readVoiceDemoSession } from "@/lib/voice-demo-session";
import { isPlumbingVertical } from "@/lib/voice-demo-vertical";
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
  const dailyQuota = await getVoiceDemoDailyQuotaStatus(row.email, { ip: clientIp(req) });

  const plumbingJob =
    isPlumbingVertical(session.vertical) ?
      await getLatestPlumbingJobForLead(session.leadId)
    : null;

  return NextResponse.json({
    ok: true,
    active: true,
    leadId: row.id,
    verified: session.verified && verified,
    vertical: session.vertical,
    channel: row.primary_channel,
    destination: row.primary_channel === "email" ? row.email : row.phone,
    fullName: row.full_name,
    phoneOnFile: Boolean(row.phone),
    configured: Boolean(geminiApiKey()),
    promoSent: Boolean(row.promo_sent_at),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    smsConfigured: twilioMessagingConfigured(),
    dailyQuota: {
      used: dailyQuota.used,
      limit: dailyQuota.limit,
      remaining: dailyQuota.remaining,
      allowlisted: dailyQuota.allowlisted,
    },
    plumbingJob: plumbingJob
      ? {
          status: plumbingJob.status,
          serviceType: plumbingJob.service_type,
          serviceAddress: plumbingJob.service_address,
          customerEmail: plumbingJob.customer_email,
          appointmentDate: plumbingJob.appointment_date,
          timeWindow: plumbingJob.time_window,
        }
      : null,
  });
}
