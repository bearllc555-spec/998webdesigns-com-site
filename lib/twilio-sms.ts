import { twilioBasicAuth, twilioCredentials } from "@/lib/twilio-verify";

export function twilioMessagingFrom(): string | null {
  return process.env.TWILIO_MESSAGING_FROM?.trim() || null;
}

export function twilioMessagingConfigured(): boolean {
  return Boolean(twilioCredentials() && twilioMessagingFrom());
}

export async function sendTwilioSms(
  toE164: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const creds = twilioCredentials();
  const from = twilioMessagingFrom();
  if (!creds || !from) {
    return { ok: false, error: "SMS messaging is not configured (TWILIO_MESSAGING_FROM)" };
  }

  const params = new URLSearchParams({ To: toE164, From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${twilioBasicAuth(creds.accountSid, creds.authToken)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn("[twilio-sms] send failed:", res.status, detail);
    return { ok: false, error: "Could not send SMS" };
  }

  return { ok: true };
}
