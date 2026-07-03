import { twilioBasicAuth, twilioCredentials } from "@/lib/twilio-verify";

export function twilioMessagingFrom(): string | null {
  return process.env.TWILIO_MESSAGING_FROM?.trim() || null;
}

export function twilioMessagingServiceSid(): string | null {
  return process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || null;
}

/** A2P 10DLC footer - appended to outbound SMS when missing. */
export const TWILIO_SMS_COMPLIANCE_SUFFIX =
  " Reply HELP for help, STOP to cancel. Msg & data rates may apply.";

export function withSmsComplianceFooter(body: string): string {
  const trimmed = body.trim();
  if (/reply help|stop to cancel/i.test(trimmed)) return trimmed;
  return `${trimmed}${TWILIO_SMS_COMPLIANCE_SUFFIX}`;
}

export function twilioMessagingConfigured(): boolean {
  return Boolean(
    twilioCredentials() && (twilioMessagingFrom() || twilioMessagingServiceSid())
  );
}

type TwilioMessageRecord = {
  sid?: string;
  status?: string;
  error_code?: number | null;
  error_message?: string | null;
};

function twilioDeliveryError(record: TwilioMessageRecord): string {
  if (record.error_code === 30034) {
    return "SMS blocked: sending number needs US A2P 10DLC or verified toll-free registration in Twilio.";
  }
  if (record.error_message) return record.error_message;
  if (record.error_code) return `SMS delivery failed (Twilio error ${record.error_code}).`;
  return `SMS delivery failed (status: ${record.status ?? "unknown"}).`;
}

async function fetchTwilioMessage(
  accountSid: string,
  authToken: string,
  messageSid: string
): Promise<TwilioMessageRecord | null> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`,
    {
      headers: { Authorization: `Basic ${twilioBasicAuth(accountSid, authToken)}` },
    }
  );
  if (!res.ok) return null;
  return (await res.json()) as TwilioMessageRecord;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendTwilioSms(
  toE164: string,
  body: string
): Promise<{ ok: true; messageSid: string } | { ok: false; error: string }> {
  const creds = twilioCredentials();
  const from = twilioMessagingFrom();
  const messagingServiceSid = twilioMessagingServiceSid();
  if (!creds || (!from && !messagingServiceSid)) {
    return {
      ok: false,
      error: "SMS messaging is not configured (TWILIO_MESSAGING_FROM or TWILIO_MESSAGING_SERVICE_SID)",
    };
  }

  const params = new URLSearchParams({
    To: toE164,
    Body: withSmsComplianceFooter(body),
  });
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (from) {
    params.set("From", from);
  }
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
    let error = "Could not send SMS";
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed.message) error = parsed.message;
    } catch {
      /* keep generic */
    }
    return { ok: false, error };
  }

  const created = (await res.json()) as TwilioMessageRecord;
  const messageSid = created.sid;
  if (!messageSid) {
    return { ok: false, error: "Twilio accepted the message but returned no message SID." };
  }

  // API 201 only means queued - carriers can still reject (e.g. A2P 10DLC error 30034).
  await sleep(2500);
  const final = await fetchTwilioMessage(creds.accountSid, creds.authToken, messageSid);
  const status = final?.status ?? created.status;
  if (status === "undelivered" || status === "failed") {
    const error = twilioDeliveryError(final ?? created);
    console.warn("[twilio-sms] delivery failed", {
      messageSid,
      status,
      error,
      to: toE164,
      from: from ?? messagingServiceSid,
    });
    return { ok: false, error };
  }

  return { ok: true, messageSid };
}
