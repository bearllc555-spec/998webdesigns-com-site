function splitEmail(email: string): { local: string; domain: string } | null {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;
  return { local: normalized.slice(0, at), domain: normalized.slice(at + 1) };
}

/** Local part only: one letter/symbol at a time with spaces (stops at @). */
function spellLocalPart(local: string): string {
  return local.split("").join(" ");
}

function speakDomain(domain: string): string {
  return `at ${domain.replace(/\./g, " dot ")}`;
}

/** Natural pronunciation — e.g. ademeo@gmail.com → "ademeo at gmail dot com". */
export function pronounceEmailForVoice(email: string): string {
  const parts = splitEmail(email);
  if (!parts) return email.trim().toLowerCase();
  return `${parts.local} ${speakDomain(parts.domain)}`;
}

/** Letter-by-letter local part — e.g. "a d e m e o". */
export function spellEmailLocalPartForVoice(email: string): string {
  const parts = splitEmail(email);
  if (!parts) return email.trim().toLowerCase();
  return spellLocalPart(parts.local);
}

/** Domain only — e.g. "at gmail dot com", "at abcplumbing dot com". */
export function pronounceEmailDomainForVoice(email: string): string {
  const parts = splitEmail(email);
  if (!parts) return email.trim().toLowerCase();
  return speakDomain(parts.domain);
}

export type EmailVoiceReadBack = {
  pronounce: string;
  localSpelled: string;
  domainSpoken: string;
};

/** Three-step read-back: pronounce full address, spell local part, say domain. */
export function buildEmailVoiceReadBack(email: string): EmailVoiceReadBack | null {
  const parts = splitEmail(email);
  if (!parts) return null;
  return {
    pronounce: `${parts.local} ${speakDomain(parts.domain)}`,
    localSpelled: spellLocalPart(parts.local),
    domainSpoken: speakDomain(parts.domain),
  };
}

/** Combined spell (legacy) — local part letter-by-letter then @domain. */
export function spellEmailForVoice(email: string): string {
  const parts = splitEmail(email);
  if (!parts) return email.trim().toLowerCase();
  return `${spellLocalPart(parts.local)} @${parts.domain}`;
}
