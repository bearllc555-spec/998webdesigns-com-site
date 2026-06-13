import { VOICE_DEMO_PROMO_CODE } from "@/lib/voice-demo-constants";
import { getVoiceDemoLead, updateVoiceDemoLead } from "@/lib/voice-demo-db";
import { marketingSiteOrigin } from "@/lib/site-origin";
import { sendTwilioSms, twilioMessagingConfigured } from "@/lib/twilio-sms";

export type VoiceDemoPromoSmsResult =
  | { ok: true; smsSent: true; promoCode: string }
  | { ok: false; smsSent: false; error: string; smsConfigured: boolean };

export async function deliverVoiceDemoPromoSms(leadId: string): Promise<VoiceDemoPromoSmsResult> {
  const row = await getVoiceDemoLead(leadId);
  if (!row?.phone) {
    return { ok: false, smsSent: false, error: "No phone on file.", smsConfigured: twilioMessagingConfigured() };
  }

  if (row.phone_verified_at) {
    return {
      ok: true,
      smsSent: true,
      promoCode: row.promo_code ?? VOICE_DEMO_PROMO_CODE,
    };
  }

  const smsConfigured = twilioMessagingConfigured();
  if (!smsConfigured) {
    return {
      ok: false,
      smsSent: false,
      error: "SMS is not configured on this server. Use the VOICE20 email instead.",
      smsConfigured: false,
    };
  }

  const first = row.full_name?.split(" ")[0] ?? "there";
  const body = `Hi ${first} - your 998 web designs code: ${VOICE_DEMO_PROMO_CODE} (20% off design fee). Start at ${marketingSiteOrigin()}/start`;
  const sms = await sendTwilioSms(row.phone, body);
  if (!sms.ok) {
    console.warn("[voice-demo-promo-sms] Twilio send failed", {
      leadId,
      to: row.phone,
      error: sms.error,
    });
    return { ok: false, smsSent: false, error: sms.error, smsConfigured: true };
  }

  const now = new Date().toISOString();
  await updateVoiceDemoLead(leadId, {
    phone_verified_at: now,
    promo_code: row.promo_code ?? VOICE_DEMO_PROMO_CODE,
    ...(row.promo_sent_at ? {} : { promo_sent_at: now }),
  });

  return { ok: true, smsSent: true, promoCode: VOICE_DEMO_PROMO_CODE };
}

export function promoSmsToolPayload(result: VoiceDemoPromoSmsResult): Record<string, unknown> {
  if (result.ok) {
    return {
      ok: true,
      smsSent: true,
      promoCode: result.promoCode,
      spellOnce: false,
      message:
        "SMS sent with VOICE20. Tell them briefly the text is on its way. Do not repeat or spell the phone number.",
    };
  }

  return {
    ok: false,
    smsSent: false,
    smsConfigured: result.smsConfigured,
    error: result.error,
    message: result.smsConfigured
      ? "SMS failed - apologize briefly; offer send_promo_email if they have not received the code yet."
      : "SMS not available - apologize; offer send_promo_email to their verified address instead. Do NOT say a text was sent.",
  };
}
