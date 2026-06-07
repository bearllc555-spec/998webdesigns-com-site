import { NextRequest, NextResponse } from "next/server";
import { enforceApiRateLimit, rateLimitResponse, clientIp } from "@/lib/api-rate-limit";
import { readJsonBody } from "@/lib/read-json-body";
import { isValidEmail } from "@/lib/validate-email";
import { normalizePhoneE164, startSmsVerification } from "@/lib/twilio-verify";
import { generateSixDigitCode } from "@/lib/voice-demo-code";
import { insertVoiceDemoLead } from "@/lib/voice-demo-db";
import { startEmailVerificationLead } from "@/lib/voice-demo-start-email";
import { setVoiceDemoSessionCookie } from "@/lib/voice-demo-session";

export const runtime = "nodejs";

type StartBody = {
  channel?: string;
  email?: string;
  phone?: string;
  smsConsent?: boolean;
  website?: string;
};

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/voice-demo/start");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.body as StartBody;
  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const channel = body.channel === "sms" ? "sms" : body.channel === "email" ? "email" : null;
  if (!channel) {
    return NextResponse.json({ error: "Choose email or phone verification." }, { status: 400 });
  }

  const ip = clientIp(req);

  if (channel === "email") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const started = await startEmailVerificationLead(email, ip);
    if (!started.ok) {
      return NextResponse.json({ error: started.error }, { status: 503 });
    }

    const res = NextResponse.json({
      ok: true,
      leadId: started.leadId,
      channel: "email",
      destination: started.destination,
    });
    setVoiceDemoSessionCookie(res, started.leadId, false);
    return res;
  }

  const phoneE164 = typeof body.phone === "string" ? normalizePhoneE164(body.phone) : null;
  if (!phoneE164) {
    return NextResponse.json({ error: "Enter a valid US phone number." }, { status: 400 });
  }
  if (body.smsConsent !== true) {
    return NextResponse.json(
      { error: "SMS consent is required to verify your phone number." },
      { status: 400 }
    );
  }

  const code = generateSixDigitCode();
  const inserted = await insertVoiceDemoLead({
    primary_channel: "sms",
    email: null,
    phone: phoneE164,
    ip,
    verification_code: code,
  });

  if (!inserted.ok) {
    return NextResponse.json(
      { error: "Could not start demo. Try again or contact us." },
      { status: 503 }
    );
  }

  const sms = await startSmsVerification(phoneE164);
  if (!sms.ok) {
    return NextResponse.json({ error: sms.error }, { status: 503 });
  }

  const res = NextResponse.json({
    ok: true,
    leadId: inserted.id,
    channel: "sms",
    destination: phoneE164,
  });
  setVoiceDemoSessionCookie(res, inserted.id, false);
  return res;
}
