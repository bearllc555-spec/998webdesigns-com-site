/** Local part only: one letter/symbol at a time with spaces (stops at @). */
function spellLocalPart(local: string): string {
  return local.split("").join(" ");
}

/** Spoken form of an email for the assistant to read aloud. */
export function spellEmailForVoice(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at <= 0 || at === normalized.length - 1) {
    return normalized;
  }

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  return `${spellLocalPart(local)} @${domain}`;
}
