import { normalizePhoneE164 } from "@/lib/twilio-verify";

/** Max SMS destinations per standard/emergency booking confirmation (caller + ops copies). */
export const PLUMBING_BOOKING_SMS_MAX_RECIPIENTS = 4;

function normalizeSmsPhone(raw: string): string | null {
  return normalizePhoneE164(raw.trim());
}

/** Comma/semicolon/whitespace-separated ops numbers from PLUMBING_DEMO_SMS_CC (testing). */
export function parsePlumbingDemoSmsCcNumbers(): string[] {
  const raw = process.env.PLUMBING_DEMO_SMS_CC?.trim();
  if (!raw) return [];
  return raw.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
}

/** Caller first, then env CC list — deduped E.164, capped at PLUMBING_BOOKING_SMS_MAX_RECIPIENTS. */
export function resolvePlumbingBookingSmsRecipients(callerPhone: string): string[] {
  const seen = new Set<string>();
  const recipients: string[] = [];

  const add = (raw: string) => {
    if (recipients.length >= PLUMBING_BOOKING_SMS_MAX_RECIPIENTS) return;
    const e164 = normalizeSmsPhone(raw);
    if (!e164 || seen.has(e164)) return;
    seen.add(e164);
    recipients.push(e164);
  };

  add(callerPhone);
  for (const cc of parsePlumbingDemoSmsCcNumbers()) {
    add(cc);
  }

  return recipients;
}

export function plumbingDemoSmsCcCount(): number {
  return parsePlumbingDemoSmsCcNumbers().length;
}
