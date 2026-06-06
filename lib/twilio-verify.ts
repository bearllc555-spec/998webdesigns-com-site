export type TwilioVerifyConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

export function twilioCredentials(): { accountSid: string; authToken: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) return null;
  return { accountSid, authToken };
}

export function twilioVerifyConfig(): TwilioVerifyConfig | null {
  const creds = twilioCredentials();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!creds || !serviceSid) return null;
  return { ...creds, serviceSid };
}

export function twilioBasicAuth(accountSid: string, authToken: string): string {
  return Buffer.from(`${accountSid}:${authToken}`).toString("base64");
}

function basicAuth(config: TwilioVerifyConfig): string {
  return twilioBasicAuth(config.accountSid, config.authToken);
}

/** E.164-ish normalization for US numbers. */
export function normalizePhoneE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export async function startSmsVerification(phoneE164: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = twilioVerifyConfig();
  if (!config) {
    return { ok: false, error: "SMS verification is not configured" };
  }

  const body = new URLSearchParams({ To: phoneE164, Channel: "sms" });
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${config.serviceSid}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(config)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn("[twilio-verify] start failed:", res.status, detail);
    return { ok: false, error: "Could not send verification code" };
  }

  return { ok: true };
}

export async function checkSmsVerification(
  phoneE164: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = twilioVerifyConfig();
  if (!config) {
    return { ok: false, error: "SMS verification is not configured" };
  }

  const body = new URLSearchParams({ To: phoneE164, Code: code.trim() });
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${config.serviceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(config)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    return { ok: false, error: "Invalid or expired code" };
  }

  const data = (await res.json()) as { status?: string };
  if (data.status !== "approved") {
    return { ok: false, error: "Invalid or expired code" };
  }

  return { ok: true };
}
