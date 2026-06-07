import { generateSixDigitCode } from "@/lib/voice-demo-code";
import { insertVoiceDemoLead } from "@/lib/voice-demo-db";
import { sendVoiceDemoVerificationEmail } from "@/lib/voice-demo-email";

export async function startEmailVerificationLead(
  email: string,
  ip: string | null
): Promise<
  { ok: true; leadId: string; destination: string } | { ok: false; error: string }
> {
  const code = generateSixDigitCode();
  const inserted = await insertVoiceDemoLead({
    primary_channel: "email",
    email,
    phone: null,
    ip,
    verification_code: code,
  });

  if (!inserted.ok) {
    return { ok: false, error: "Could not start demo. Try again or contact us." };
  }

  const emailed = await sendVoiceDemoVerificationEmail(email, code);
  if (!emailed) {
    return { ok: false, error: "Could not send verification email." };
  }

  return { ok: true, leadId: inserted.id, destination: email };
}
