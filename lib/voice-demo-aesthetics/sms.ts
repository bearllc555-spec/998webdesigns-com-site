import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { buildAestheticsConfirmationSms } from "@/lib/voice-demo-aesthetics/email";
import { sendTwilioSms, twilioMessagingConfigured } from "@/lib/twilio-sms";

export async function sendAestheticsConfirmationSms(
  brand: AestheticsDemoBrand,
  phone: string,
  firstName: string,
  service: string,
  when: string
): Promise<{ ok: boolean; smsSent: boolean; error?: string }> {
  if (!twilioMessagingConfigured()) {
    return { ok: false, smsSent: false, error: "SMS not configured" };
  }
  const body = buildAestheticsConfirmationSms(brand, firstName, service, when);
  const result = await sendTwilioSms(phone, body);
  if (!result.ok) {
    return { ok: false, smsSent: false, error: result.error };
  }
  return { ok: true, smsSent: true };
}

export async function sendAestheticsAfterHoursSms(
  brand: AestheticsDemoBrand,
  phone: string,
  firstName: string
): Promise<{ ok: boolean; smsSent: boolean; error?: string }> {
  if (!twilioMessagingConfigured()) {
    return { ok: false, smsSent: false, error: "SMS not configured" };
  }
  const body = `Hi ${firstName} — thanks for reaching out tonight! We'll text you back shortly with next steps.`;
  const result = await sendTwilioSms(phone, body);
  if (!result.ok) {
    return { ok: false, smsSent: false, error: result.error };
  }
  return { ok: true, smsSent: true };
}
