import { isValidEmail } from "@/lib/validate-email";
import { spellEmailForVoice } from "@/lib/voice-demo-spell-email";
import { spellPhoneForVoice } from "@/lib/voice-demo-spell-phone";

export type PlumbingContactField = "name" | "serviceAddress" | "email" | "phone";

/** Booking intake order — reconfirm one field at a time, earliest first. */
export const PLUMBING_CONTACT_RECONFIRM_ORDER: PlumbingContactField[] = [
  "name",
  "serviceAddress",
  "email",
  "phone",
];

export const PLUMBING_CONTACT_PAUSE_CUE = "[plumbing-contact-pause]";

const CONTACT_FIELD_LABEL: Record<PlumbingContactField, string> = {
  name: "name",
  serviceAddress: "service address",
  email: "email",
  phone: "phone number",
};

const CONTACT_PAUSE_RULE =
  "Then STOP speaking — stay silent and give the caller a moment to answer. " +
  "Do NOT ask for the next field (phone, date, time, etc.) in this turn or your next turn until they clearly say yes or correct you.";

export type PlumbingContactReconfirmInput = {
  name?: string;
  serviceAddress?: string;
  email?: string;
  phone?: string;
  /** Caller said yes to using the email they typed to start the demo. */
  emailFromDemoLogin?: boolean;
  /** When set, only reconfirm this field. Otherwise pick earliest field present in input. */
  focusField?: PlumbingContactField;
};

/** Which contact field to reconfirm when a tool save includes multiple values. */
export function plumbingContactReconfirmFocusField(
  input: PlumbingContactReconfirmInput
): PlumbingContactField | null {
  if (input.focusField) {
    const value =
      input.focusField === "name"
        ? input.name
        : input.focusField === "serviceAddress"
          ? input.serviceAddress
          : input.focusField === "email"
            ? input.email
            : input.phone;
    return value?.trim() ? input.focusField : null;
  }
  for (const field of PLUMBING_CONTACT_RECONFIRM_ORDER) {
    const value =
      field === "name"
        ? input.name
        : field === "serviceAddress"
          ? input.serviceAddress
          : field === "email"
            ? input.email
            : input.phone;
    if (value?.trim()) return field;
  }
  return null;
}

/** Hidden nudge after Jarvis read-back — hold the line until the caller confirms. */
export function buildPlumbingContactPauseNudge(field: PlumbingContactField): string {
  const label = CONTACT_FIELD_LABEL[field];
  return (
    `${PLUMBING_CONTACT_PAUSE_CUE} You just read back their ${label} and asked if it is correct. ` +
    `Stay completely silent now — give the caller time to answer yes or offer a correction. ` +
    `Do NOT ask for phone, appointment date, or any other detail until they confirm this ${label}.`
  );
}

/** Prompt block for system prompt — slow intake pacing. */
export const PLUMBING_CONTACT_INTAKE_PACING = `CONTACT INTAKE PACING (critical during booking):
- One field per turn: collect → save_plumbing_contact → read back → wait for yes → only then ask the next field.
- After spelling email or phone, STOP and let the caller respond — never chain "Is that correct? And what's your phone number?" in one breath.
- If they go quiet for a moment after a read-back, stay silent; they may be verifying spelling in their head.
- Name → address → email → phone → date/time — never skip ahead while a read-back is still unanswered.`;

/** Prompt block when the caller already verified an email at the demo gate. */
export function buildPlumbingGateEmailOfferBlock(gateEmail: string): string | null {
  const email = gateEmail.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return null;
  const spoken = spellEmailForVoice(email);
  return `DEMO LOGIN EMAIL (use first — saves time):
- The caller typed ${email} to start this demo. When booking needs an email, ask FIRST: "Is ${email} the best email to reach you?" (You may read the domain naturally, e.g. "at gmail dot com".)
- If YES: call save_plumbing_contact with email "${email}" only — do NOT ask them to say or spell the address again. Then spell reconfirm aloud: "${spoken}" and wait for yes (${CONTACT_PAUSE_RULE})
- If NO: ask "What's the best email?" collect it, save_plumbing_contact with email only, then spell reconfirm the new address and wait for yes before phone or scheduling.
- Never skip straight to "What's your email?" or phone when demo login email is on file.`;
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

function buildReconfirmLine(
  field: PlumbingContactField,
  input: PlumbingContactReconfirmInput
): string | null {
  switch (field) {
    case "name": {
      const name = input.name?.trim();
      if (!name) return null;
      return (
        `Name (THIS TURN ONLY): read back "${name}" and ask "Is that the correct name?" ${CONTACT_PAUSE_RULE}`
      );
    }
    case "serviceAddress": {
      const address = input.serviceAddress?.trim();
      if (!address) return null;
      return (
        `Address (THIS TURN ONLY): read back "${address}" and ask "Is that the right service address?" ${CONTACT_PAUSE_RULE}`
      );
    }
    case "email": {
      const email = input.email?.trim();
      if (!email) return null;
      const spoken = spellEmailForVoice(email);
      const prefix = input.emailFromDemoLogin
        ? "Email (demo login accepted — THIS TURN ONLY): they confirmed the address they used to start this demo — "
        : "Email (THIS TURN ONLY): ";
      return (
        `${prefix}say the local part letter-by-letter, then the domain — speak exactly: "${spoken}" — ` +
        `then ask "Is that the correct email?" ${CONTACT_PAUSE_RULE} Do not skip spelling the part before @.`
      );
    }
    case "phone": {
      const phone = input.phone?.trim();
      if (!phone) return null;
      const spoken = plumbingContactFieldSpoken("phone", phone);
      if (!spoken) return null;
      return (
        `Phone (THIS TURN ONLY): read digits spaced — "${spoken}" — ` +
        `then ask "Is that the best number to reach you?" ${CONTACT_PAUSE_RULE}`
      );
    }
    default:
      return null;
  }
}

/** Tool message instructing Jarvis to reconfirm one saved field before moving on. */
export function buildPlumbingContactReconfirmMessage(
  input: PlumbingContactReconfirmInput
): { message: string | null; focusField: PlumbingContactField | null } {
  const focusField = plumbingContactReconfirmFocusField(input);
  if (!focusField) return { message: null, focusField: null };
  const line = buildReconfirmLine(focusField, input);
  if (!line) return { message: null, focusField: null };
  return {
    focusField,
    message: `Contact saved. REQUIRED reconfirm before continuing — handle ONLY this field now:\n${line}`,
  };
}
