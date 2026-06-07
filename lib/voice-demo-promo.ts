import { VOICE_DEMO_PROMO_CODE } from "@/lib/voice-demo-constants";
import {
  promoAlreadySentForContact,
  updateVoiceDemoLead,
  type VoiceDemoLeadRow,
} from "@/lib/voice-demo-db";
import { sendVoiceDemoPromoEmail } from "@/lib/voice-demo-email";

/** Email-channel leads: send VOICE20 to verified address once after code verify. */
export async function sendPromoToVerifiedEmailLead(
  row: VoiceDemoLeadRow
): Promise<{ sent: boolean; alreadySent: boolean }> {
  if (row.primary_channel !== "email" || !row.email) {
    return { sent: false, alreadySent: false };
  }

  if (row.promo_sent_at || (await promoAlreadySentForContact(row.email, null))) {
    return { sent: false, alreadySent: true };
  }

  const sent = await sendVoiceDemoPromoEmail(row.email, row.full_name);
  if (!sent) {
    return { sent: false, alreadySent: false };
  }

  await updateVoiceDemoLead(row.id, {
    promo_sent_at: new Date().toISOString(),
    promo_code: VOICE_DEMO_PROMO_CODE,
  });

  return { sent: true, alreadySent: false };
}
