import { isValidEmail } from "@/lib/validate-email";
import { normalizePhoneE164 } from "@/lib/twilio-verify";

export type ValidatedDiscoveryStart = {
  fullName: string;
  companyName: string;
  email: string;
  phoneE164: string;
  goal: string;
  smsConsent: true;
};

function str(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

export function validateDiscoveryStartPayload(
  body: Record<string, unknown>
): { ok: true; data: ValidatedDiscoveryStart } | { ok: false; error: string } {
  const fullName = str(body.fullName);
  const companyName = str(body.companyName);
  const email = str(body.email);
  const phoneRaw = str(body.phone);
  const goal = str(body.goal) ?? "";
  const smsConsent = body.smsConsent === true;

  if (!fullName) return { ok: false, error: "Missing required field: fullName" };
  if (!companyName) return { ok: false, error: "Missing required field: companyName" };
  if (!email) return { ok: false, error: "Missing required field: email" };
  if (!isValidEmail(email)) return { ok: false, error: "Invalid email address" };
  if (!phoneRaw) return { ok: false, error: "Missing required field: phone" };
  if (!smsConsent) {
    return { ok: false, error: "SMS consent is required to verify your phone number" };
  }

  const phoneE164 = normalizePhoneE164(phoneRaw);
  if (!phoneE164) {
    return { ok: false, error: "Enter a valid US phone number" };
  }

  return {
    ok: true,
    data: { fullName, companyName, email, phoneE164, goal, smsConsent: true },
  };
}
