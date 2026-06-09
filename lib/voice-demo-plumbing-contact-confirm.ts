import { isValidEmail } from "@/lib/validate-email";
import {
  PLUMBING_CONTACT_POST_READBACK_PAUSE_MS,
  PLUMBING_PHONE_POST_READBACK_PAUSE_MS,
} from "@/lib/voice-demo-plumbing-constants";
import {
  buildEmailVoiceReadBack,
  pronounceEmailForVoice,
} from "@/lib/voice-demo-spell-email";
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
  "Do NOT ask for the next field in this turn or your next turn until they clearly say yes or correct you.";

const PHONE_PAUSE_RULE =
  "Then END your turn — stay completely silent and give the caller several seconds to verify the digits. " +
  "Do NOT ask about appointment date, day, time window, morning/afternoon, or scheduling until they clearly confirm this number.";

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

const CONTACT_PAUSE_NEXT_FIELD: Record<PlumbingContactField, string> = {
  name: "service address, email, phone, or scheduling",
  serviceAddress: "email, phone, or scheduling",
  email: "phone or scheduling",
  phone: "appointment date, day, time window, or scheduling",
};

/** Hidden nudge after Jarvis read-back — hold the line until the caller confirms. */
export function buildPlumbingContactPauseNudge(field: PlumbingContactField): string {
  const label = CONTACT_FIELD_LABEL[field];
  const nextBlocked = CONTACT_PAUSE_NEXT_FIELD[field];
  const extra =
    field === "phone"
      ? " Callers often need a beat to verify spaced digits in their head. "
      : " ";
  return (
    `${PLUMBING_CONTACT_PAUSE_CUE} You just read back their ${label} and asked if it is correct.${extra}` +
    `Stay completely silent now — give the caller time to answer yes or offer a correction. ` +
    `Do NOT ask for ${nextBlocked} until they confirm this ${label}.`
  );
}

/** Recovery when Jarvis chained scheduling before the caller confirmed phone. */
export function buildPlumbingPhoneSchedulingRecoveryNudge(): string {
  return (
    `${PLUMBING_CONTACT_PAUSE_CUE} You asked about scheduling before the caller confirmed their phone number. ` +
    `Stop immediately — do not ask about dates or times. Stay silent and let them answer whether the phone number is correct. ` +
    `Only after they say yes should you ask what day works for the appointment.`
  );
}

/** True when the caller answered a contact read-back (yes, no, or correction). */
export function userAnsweredPlumbingContactPause(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t || t.length < 2) return false;
  if (
    /\b(yes|yeah|yep|yup|correct|that'?s right|that'?s correct|absolutely|sure)\b/.test(t)
  ) {
    return true;
  }
  if (/\b(no|nope|wrong|not right|incorrect|actually)\b/.test(t)) return true;
  if (/\d{3,}/.test(t)) return true;
  return false;
}

/** Jarvis moved to scheduling before the caller confirmed phone. */
export function assistantChainedSchedulingAfterPhone(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(what day|which day|when would|appointment|schedule|scheduling|time window|time works|works for you)\b/.test(
      t
    ) ||
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow)\b/.test(t) ||
    /\b(morning|afternoon|evening)\b/.test(t)
  );
}

/** Client wait after read-back playback before the silence nudge (ms). */
export function plumbingContactPostReadbackPauseMs(field: PlumbingContactField): number {
  if (field === "phone") {
    return PLUMBING_PHONE_POST_READBACK_PAUSE_MS;
  }
  return PLUMBING_CONTACT_POST_READBACK_PAUSE_MS;
}

/** Prompt block for system prompt — slow intake pacing. */
export const PLUMBING_CONTACT_INTAKE_PACING = `CONTACT INTAKE PACING (critical during booking):
- One field per turn: collect → save_plumbing_contact → read back → wait for yes → only then ask the next field.
- After spelling email or phone, STOP and let the caller respond — never chain "Is that correct? And what's your phone number?" in one breath.
- After phone read-back: END your turn after "Is that the best number to reach you?" — never add "What day works?" or any scheduling question in the same turn. Callers need a beat to verify digits.
- If they go quiet for a moment after a read-back, stay silent; they may be verifying spelling or digits in their head.
- Name → address → email → phone → date/time — never skip ahead while a read-back is still unanswered.`;

function buildEmailReconfirmScript(
  email: string,
  options?: { signedInOffer?: boolean }
): string | null {
  const readBack = buildEmailVoiceReadBack(email);
  if (!readBack) return null;
  const { pronounce, localSpelled, domainSpoken } = readBack;
  const intro = options?.signedInOffer
    ? `Say "Should I use the email that you signed in with?" Then `
    : "";
  return (
    `${intro}(1) pronounce the full address naturally: "${pronounce}" — ` +
    `(2) spell ONLY the part before @ letter-by-letter: "${localSpelled}" — ` +
    `(3) say the domain aloud: "${domainSpoken}" — ` +
    `(4) ask "Is that the correct email?" ${CONTACT_PAUSE_RULE}`
  );
}

/** Prompt block when the caller already verified an email at the demo gate. */
export function buildPlumbingGateEmailOfferBlock(gateEmail: string): string | null {
  const email = gateEmail.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return null;
  const readBackScript = buildEmailReconfirmScript(email, { signedInOffer: true });
  if (!readBackScript) return null;
  return `DEMO LOGIN EMAIL (use first — saves time):
- The caller signed in with ${email}. When booking needs an email, ${readBackScript}
- If YES: call save_plumbing_contact with email "${email}" only — do NOT ask them to spell the address. Move to callback phone or scheduling.
- If NO: ask "What's the best email to reach you?" collect it, save_plumbing_contact with email only, then use the same pronounce → spell local → domain → confirm pattern before phone or scheduling.
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
      return pronounceEmailForVoice(trimmed);
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
      const script = buildEmailReconfirmScript(email);
      if (!script) return null;
      const prefix = input.emailFromDemoLogin
        ? "Email (demo login — THIS TURN ONLY): they confirmed their sign-in email — "
        : "Email (THIS TURN ONLY): ";
      return `${prefix}${script} Do not skip the pronounce step or letter-by-letter spelling.`;
    }
    case "phone": {
      const phone = input.phone?.trim();
      if (!phone) return null;
      const spoken = plumbingContactFieldSpoken("phone", phone);
      if (!spoken) return null;
      return (
        `Phone (THIS TURN ONLY): read digits spaced — "${spoken}" — ` +
        `then ask ONLY "Is that the best number to reach you?" ${PHONE_PAUSE_RULE}`
      );
    }
    default:
      return null;
  }
}

/** True when a newly saved value differs from what is already on file (skip duplicate read-back). */
export function plumbingContactFieldChanged(
  field: PlumbingContactField,
  newValue: string,
  onFile: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    serviceAddress?: string | null;
  }
): boolean {
  const trimmed = newValue.trim();
  if (!trimmed) return false;
  switch (field) {
    case "name":
      return trimmed.toLowerCase() !== (onFile.name?.trim().toLowerCase() ?? "");
    case "serviceAddress":
      return trimmed.toLowerCase() !== (onFile.serviceAddress?.trim().toLowerCase() ?? "");
    case "email":
      return trimmed.toLowerCase() !== (onFile.email?.trim().toLowerCase() ?? "");
    case "phone": {
      const next = trimmed.replace(/\D/g, "").slice(-10);
      const prev = (onFile.phone ?? "").replace(/\D/g, "").slice(-10);
      return next.length >= 10 && next !== prev;
    }
    default:
      return true;
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
