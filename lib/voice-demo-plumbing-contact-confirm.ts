import { isValidEmail } from "@/lib/validate-email";
import { spellEmailForVoice } from "@/lib/voice-demo-spell-email";
import { spellPhoneForVoice } from "@/lib/voice-demo-spell-phone";

export type PlumbingContactField = "name" | "serviceAddress" | "email" | "phone";

export type PlumbingContactReconfirmInput = {
  name?: string;
  serviceAddress?: string;
  email?: string;
  phone?: string;
  /** Caller said yes to using the email they typed to start the demo. */
  emailFromDemoLogin?: boolean;
};

/** Prompt block when the caller already verified an email at the demo gate. */
export function buildPlumbingGateEmailOfferBlock(gateEmail: string): string | null {
  const email = gateEmail.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return null;
  const spoken = spellEmailForVoice(email);
  return `DEMO LOGIN EMAIL (use first — saves time):
- The caller typed ${email} to start this demo. When booking needs an email, ask FIRST: "Is ${email} the best email to reach you?" (You may read the domain naturally, e.g. "at gmail dot com".)
- If YES: call save_plumbing_contact with email "${email}" — do NOT ask them to say or spell the address again. Then spell reconfirm aloud: "${spoken}" and wait for yes (see CONFIRMATION).
- If NO: ask "What's the best email?" collect it, save_plumbing_contact, then spell reconfirm the new address.
- Never skip straight to "What's your email?" when demo login email is on file.`;
}

/** Spoken read-back for a field Jarvis must reconfirm before moving on. */
export function plumbingContactFieldSpoken(
  field: PlumbingContactField,
  value: string
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  switch (field) {
    case "name":
      return trimmed;
    case "serviceAddress":
      return trimmed;
    case "email":
      return spellEmailForVoice(trimmed);
    case "phone": {
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 10) return trimmed;
      const e164 =
        digits.length === 11 && digits.startsWith("1") ? `+${digits}` : `+1${digits.slice(-10)}`;
      return spellPhoneForVoice(e164);
    }
    default:
      return trimmed;
  }
}

/** Tool message instructing Jarvis to reconfirm each field just saved. */
export function buildPlumbingContactReconfirmMessage(
  input: PlumbingContactReconfirmInput
): string | null {
  const lines: string[] = [];

  if (input.name?.trim()) {
    lines.push(
      `Name: read back "${input.name.trim()}" and ask "Is that the correct name?" Wait for yes before the next question.`
    );
  }
  if (input.serviceAddress?.trim()) {
    lines.push(
      `Address: read back "${input.serviceAddress.trim()}" and ask "Is that the right service address?" Wait for yes.`
    );
  }
  if (input.email?.trim()) {
    const spoken = spellEmailForVoice(input.email);
    const prefix = input.emailFromDemoLogin
      ? "Email (demo login accepted): they confirmed the address they used to start this demo — "
      : "Email (required): ";
    lines.push(
      `${prefix}say the local part letter-by-letter, then the domain — speak exactly: "${spoken}" — then ask "Is that the correct email?" Wait for yes. Do not skip spelling the part before @.`
    );
  }
  if (input.phone?.trim()) {
    const spoken = plumbingContactFieldSpoken("phone", input.phone);
    if (spoken) {
      lines.push(
        `Phone: read digits spaced — "${spoken}" — then ask "Is that the best number to reach you?" Wait for yes.`
      );
    }
  }

  if (lines.length === 0) return null;
  return `Contact saved. REQUIRED reconfirm before continuing:\n${lines.join("\n")}`;
}
