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
  "phone",
  "email",
];

export const PLUMBING_BOOKING_INTAKE_ORDER = `BOOKING CONTACT ORDER (personal-assistant flow — never skip ahead):
1. Full name — if only a first name is on file, capture last name FIRST: "I have [first] as your first name. How do I spell your last name?" They may say or spell it; repeat it back, save the full name, spell the last name letter-by-letter, confirm, then continue.
2. Service address — read back and confirm.
3. Phone number — read digits spaced and confirm.
4. Email address — pronounce full, spell EVERY character before @ one letter at a time, then say the domain, then confirm. Never group unspelled letters (WRONG for ademeo@gmail.com: "a d e meo" — RIGHT: "a d e m e o" then "at gmail dot com").
5. Service type, appointment date, and time window — only after contact info is complete.`;

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

export function splitPersonName(full: string): {
  firstName: string;
  lastName: string | null;
} {
  const trimmed = full.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: null };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function hasFullPersonName(full: string): boolean {
  return splitPersonName(full).lastName !== null;
}

/** Letter-by-letter — e.g. Demeo → "d e m e o". */
export function spellNamePartForVoice(part: string): string {
  return part.trim().toLowerCase().split("").join(" ");
}

export type PlumbingContactReconfirmInput = {
  name?: string;
  serviceAddress?: string;
  email?: string;
  phone?: string;
  /** Caller said yes to using the email they typed to start the demo. */
  emailFromDemoLogin?: boolean;
  /** Booking/scheduling intake — last name required before other contact fields. */
  bookingIntake?: boolean;
  /** When set, only reconfirm this field. Otherwise pick earliest field present in input. */
  focusField?: PlumbingContactField;
};

export function buildPlumbingLastNameBlockedMessage(firstName: string): string {
  return (
    `BLOCKED: only first name "${firstName}" on file. Before address, phone, or email, ask NOW: ` +
    `"I have ${firstName} as your first name. How do I spell your last name?" ` +
    `Listen, repeat their last name, save the full name, confirm spelling, then continue intake.`
  );
}

/** Block saving address/phone/email while only a first name is on file during booking. */
export function plumbingIntakeBlockedWithoutLastName(opts: {
  nameOnFile: string;
  saving: {
    serviceAddress?: string;
    phone?: string;
    email?: string;
    serviceType?: string;
    appointmentDate?: string;
    timeWindow?: string;
  };
}): string | null {
  const name = opts.nameOnFile.trim();
  if (!name || hasFullPersonName(name)) return null;
  const savingOther = Object.values(opts.saving).some((v) => Boolean(v?.trim()));
  if (!savingOther) return null;
  return buildPlumbingLastNameBlockedMessage(splitPersonName(name).firstName);
}

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
  name: "service address, phone, email, or scheduling",
  serviceAddress: "phone, email, or scheduling",
  phone: "email or scheduling",
  email: "appointment date, day, time window, or scheduling",
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
- One field per turn: collect → save_plumbing_contact → read back when required → wait for yes → only then ask the next field.
- First name alone (casual chat): save it, do NOT ask "Is that your name?"
- First name alone (booking): BEFORE address, phone, or email, ask "I have [first] as your first name. How do I spell your last name?" — mandatory, never skip.
- Full name (first + last): pronounce the first name, spell the last name letter-by-letter, then ask if the name is correct — same pacing as email but inverted.
- Email local part: every character before @ individually — never stop early or group the rest (ademeo@gmail.com = "a d e m e o", never "a d e meo@gmail.com").
- After spelling email or phone, STOP and let the caller respond — never chain confirmation with the next question.
- After phone read-back: END your turn after "Is that the best number to reach you?" — never add scheduling in the same turn.
- Full name → address → phone → email → date/time — never skip ahead while a read-back is still unanswered.`;

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
    `(2) spell ONLY the part before @ — EVERY character individually with spaces, no grouping: "${localSpelled}" — ` +
    `NEVER truncate the local part (WRONG: "a d e meo" or "meo@gmail.com" as one chunk; spell ALL ${localSpelled.split(" ").length} letters) — ` +
    `(3) say the domain aloud separately: "${domainSpoken}" — ` +
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
- If YES: call save_plumbing_contact with email "${email}" only — do NOT ask them to spell the address. Use the full pronounce → spell every local letter → domain → confirm pattern.
- If NO: ask "What's the best email to reach you?" collect it, save_plumbing_contact with email only, then use the same pronounce → spell local → domain → confirm pattern.
- Collect email only after full name, address, and phone are confirmed — never before phone in the booking flow.`;
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

function buildFirstNameOnlyGuidance(firstName: string, bookingIntake: boolean): string {
  if (bookingIntake) {
    return (
      `Name (THIS TURN ONLY — REQUIRED): Only "${firstName}" is on file. BEFORE address, phone, email, or scheduling you MUST ask: ` +
      `"I have ${firstName} as your first name. How do I spell your last name?" ` +
      `Listen — they may say or spell it. Repeat their last name back, call save_plumbing_contact with the full name, ` +
      `then spell the last name letter-by-letter and ask if the name is correct. Do NOT ask for address, phone, or email yet.`
    );
  }
  return (
    `Name (THIS TURN ONLY): "${firstName}" saved. Do NOT read it back and do NOT ask "Is that your name?" — ` +
    `if Jarvis misheard, the caller will interrupt and correct you. Acknowledge briefly and continue naturally.`
  );
}

function buildFullNameReconfirmScript(fullName: string): string | null {
  const { firstName, lastName } = splitPersonName(fullName);
  if (!firstName || !lastName) return null;
  const lastSpelled = spellNamePartForVoice(lastName);
  return (
    `(1) pronounce their first name naturally: "${firstName}" — ` +
    `(2) spell ONLY the last name letter-by-letter after saying it once: "${lastName}" then "${lastSpelled}" — ` +
    `(3) ask "Is that the correct name?" ${CONTACT_PAUSE_RULE}`
  );
}

function buildReconfirmLine(
  field: PlumbingContactField,
  input: PlumbingContactReconfirmInput
): string | null {
  switch (field) {
    case "name": {
      const name = input.name?.trim();
      if (!name) return null;
      if (!hasFullPersonName(name)) {
        return buildFirstNameOnlyGuidance(
          splitPersonName(name).firstName,
          input.bookingIntake === true
        );
      }
      const script = buildFullNameReconfirmScript(name);
      if (!script) return null;
      return `Name (THIS TURN ONLY): ${script}`;
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
      return `${prefix}${script} Use spoken.emailLocalSpelled for the exact local-part letters — spell every one, never group the remainder.`;
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
  if (focusField === "name" && input.name && !hasFullPersonName(input.name)) {
    const prefix = input.bookingIntake
      ? "Contact saved. REQUIRED — do this before any other intake field:\n"
      : "Contact saved. Handle ONLY this now:\n";
    return {
      focusField: null,
      message: `${prefix}${line}`,
    };
  }
  return {
    focusField,
    message: `Contact saved. REQUIRED reconfirm before continuing — handle ONLY this field now:\n${line}`,
  };
}
