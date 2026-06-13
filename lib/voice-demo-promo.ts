import { VOICE_DEMO_PROMO_CODE } from "@/lib/voice-demo-constants";
import {
  getVoiceDemoLead,
  updateVoiceDemoLead,
  type VoiceDemoLeadRow,
} from "@/lib/voice-demo-db";
import { sendVoiceDemoPromoEmail } from "@/lib/voice-demo-email";
import {
  deliverVoiceDemoPromoSms,
  type VoiceDemoPromoSmsResult,
} from "@/lib/voice-demo-promo-sms";

export type PromoEmailResult = {
  sent: boolean;
  alreadySent: boolean;
  error?: string;
};

/** Email-channel leads: send VOICE20 to verified address once per lead row. */
export async function sendPromoToVerifiedEmailLead(
  row: VoiceDemoLeadRow
): Promise<PromoEmailResult> {
  if (row.primary_channel !== "email" || !row.email) {
    return { sent: false, alreadySent: false };
  }

  if (!row.email_verified_at) {
    return { sent: false, alreadySent: false, error: "Email not verified yet." };
  }

  if (row.promo_sent_at) {
    return { sent: false, alreadySent: true };
  }

  const sent = await sendVoiceDemoPromoEmail(row.email, row.full_name);
  if (!sent) {
    console.warn("[voice-demo-promo] promo email failed", { leadId: row.id, email: row.email });
    return { sent: false, alreadySent: false, error: "Could not send promo email." };
  }

  await updateVoiceDemoLead(row.id, {
    promo_sent_at: new Date().toISOString(),
    promo_code: VOICE_DEMO_PROMO_CODE,
  });

  return { sent: true, alreadySent: false };
}

/** Idempotent - retries delivery if this lead verified email but promo not yet recorded. */
export async function ensurePromoEmailForLeadId(leadId: string): Promise<PromoEmailResult> {
  const row = await getVoiceDemoLead(leadId);
  if (!row) {
    return { sent: false, alreadySent: false, error: "Lead not found." };
  }
  return sendPromoToVerifiedEmailLead(row);
}

export type PromoBundleResult = {
  email: PromoEmailResult;
  sms: VoiceDemoPromoSmsResult | null;
};

/** Email promo + automatic SMS when a profile phone exists (consent given at onboarding). */
export async function sendPromoBundleForLeadId(leadId: string): Promise<PromoBundleResult> {
  const row = await getVoiceDemoLead(leadId);
  if (!row) {
    return {
      email: { sent: false, alreadySent: false, error: "Lead not found." },
      sms: null,
    };
  }

  const email = await sendPromoToVerifiedEmailLead(row);
  const sms = row.phone ? await deliverVoiceDemoPromoSms(leadId) : null;

  if (sms && !sms.ok) {
    console.warn("[voice-demo-promo] promo SMS failed", {
      leadId,
      phone: row.phone,
      error: sms.error,
      smsConfigured: sms.smsConfigured,
    });
  }

  return { email, sms };
}
