import {
  PLUMBING_DEMO_BUSINESS_NAME,
  PLUMBING_DEMO_PROMO_AMOUNT,
} from "@/lib/voice-demo-plumbing-constants";
import {
  formatPlumbingAppointmentDateForEmail,
  type PlumbingEmailPayload,
} from "@/lib/voice-demo-plumbing-email";
import {
  resolvePlumbingBookingSmsRecipients,
} from "@/lib/voice-demo-plumbing-sms-recipients";
import { normalizePhoneE164 } from "@/lib/twilio-verify";
import { sendTwilioSms, twilioMessagingConfigured } from "@/lib/twilio-sms";

export {
  PLUMBING_BOOKING_SMS_MAX_RECIPIENTS,
  parsePlumbingDemoSmsCcNumbers,
  plumbingDemoSmsCcCount,
  resolvePlumbingBookingSmsRecipients,
} from "@/lib/voice-demo-plumbing-sms-recipients";

export function buildPlumbingConfirmationSms(
  firstName: string,
  serviceType: string,
  appointmentDate: string,
  timeWindow: string,
  serviceAddress: string,
  promoApplied: boolean
): string {
  const date = formatPlumbingAppointmentDateForEmail(appointmentDate || "TBD");
  const window = timeWindow.trim() || "TBD";
  const address = serviceAddress.trim() || "on file";
  const promoNote = promoApplied
    ? ` Your $${PLUMBING_DEMO_PROMO_AMOUNT} coupon is in the confirmation email.`
    : "";
  return `${PLUMBING_DEMO_BUSINESS_NAME}: Hi ${firstName}, you're confirmed for ${serviceType} on ${date} (${window}) at ${address}.${promoNote} We'll call or text ~30 min before arrival.`;
}

export function buildPlumbingEmergencySms(
  firstName: string,
  serviceAddress: string,
  issueDescription: string
): string {
  const address = serviceAddress.trim() || "on file";
  const issue = issueDescription.trim() || "your emergency";
  return `${PLUMBING_DEMO_BUSINESS_NAME}: Hi ${firstName}, emergency dispatch is confirmed for ${issue} at ${address}. A tech is en route within 2 hours. Shut off your main water valve if water is still flowing.`;
}

export function buildPlumbingAfterHoursSms(firstName: string): string {
  return `${PLUMBING_DEMO_BUSINESS_NAME}: Hi ${firstName}, we got your message after hours. Someone will call you back on the next business day. For active flooding or a burst pipe, call back and say it's an emergency.`;
}

function normalizeSmsPhone(raw: string): string | null {
  return normalizePhoneE164(raw.trim());
}

export type PlumbingBookingSmsResult = {
  ok: boolean;
  smsSent: boolean;
  sentCount: number;
  recipientCount: number;
  error?: string;
};

export async function sendPlumbingBookingSms(
  payload: PlumbingEmailPayload & { phone: string; isEmergency: boolean }
): Promise<PlumbingBookingSmsResult> {
  if (!twilioMessagingConfigured()) {
    return {
      ok: false,
      smsSent: false,
      sentCount: 0,
      recipientCount: 0,
      error: "SMS not configured",
    };
  }

  const callerE164 = normalizeSmsPhone(payload.phone);
  const recipients = resolvePlumbingBookingSmsRecipients(payload.phone);
  if (recipients.length === 0) {
    return {
      ok: false,
      smsSent: false,
      sentCount: 0,
      recipientCount: 0,
      error: "Invalid callback phone for SMS",
    };
  }

  const firstName = payload.firstName.trim() || "there";
  const body = payload.isEmergency
    ? buildPlumbingEmergencySms(
        firstName,
        payload.serviceAddress ?? "",
        payload.issueDescription ?? payload.serviceType ?? ""
      )
    : buildPlumbingConfirmationSms(
        firstName,
        payload.serviceType ?? "plumbing service",
        payload.appointmentDate ?? "TBD",
        payload.timeWindow ?? "TBD",
        payload.serviceAddress ?? "",
        Boolean(payload.promoApplied || payload.promoCode)
      );

  let sentCount = 0;
  let primarySent = false;
  let firstError: string | undefined;

  for (const to of recipients) {
    const result = await sendTwilioSms(to, body);
    if (result.ok) {
      sentCount += 1;
      if (callerE164 && to === callerE164) primarySent = true;
    } else if (!firstError) {
      firstError = result.error;
    }
  }

  const callerRequired = Boolean(callerE164);
  const ok = callerRequired ? primarySent : sentCount > 0;

  return {
    ok,
    smsSent: sentCount > 0,
    sentCount,
    recipientCount: recipients.length,
    error: ok ? undefined : firstError ?? "Could not send booking SMS",
  };
}

export async function sendPlumbingAfterHoursSms(
  phone: string,
  firstName: string
): Promise<{ ok: boolean; smsSent: boolean; error?: string }> {
  if (!twilioMessagingConfigured()) {
    return { ok: false, smsSent: false, error: "SMS not configured" };
  }
  const to = normalizeSmsPhone(phone);
  if (!to) {
    return { ok: false, smsSent: false, error: "Invalid phone for SMS" };
  }
  const result = await sendTwilioSms(to, buildPlumbingAfterHoursSms(firstName));
  if (!result.ok) {
    return { ok: false, smsSent: false, error: result.error };
  }
  return { ok: true, smsSent: true };
}
