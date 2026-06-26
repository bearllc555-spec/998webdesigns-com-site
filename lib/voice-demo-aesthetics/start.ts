import { generateSixDigitCode } from "@/lib/voice-demo-code";
import { insertVoiceDemoLead, markVoiceDemoVerified } from "@/lib/voice-demo-db";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";

/** Aesthetics demo skips OTP - email gate only, verified immediately for voice. */
export async function startAestheticsDemoLead(
  brand: AestheticsDemoBrand,
  email: string,
  ip: string | null
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const code = generateSixDigitCode();
  const inserted = await insertVoiceDemoLead({
    primary_channel: "email",
    email,
    phone: null,
    ip,
    verification_code: code,
    vertical: brand,
  });

  if (!inserted.ok) {
    return { ok: false, error: "Could not start demo. Try again." };
  }

  const verified = await markVoiceDemoVerified(inserted.id, "email");
  if (!verified) {
    return { ok: false, error: "Could not start demo session." };
  }

  return { ok: true, leadId: inserted.id };
}
