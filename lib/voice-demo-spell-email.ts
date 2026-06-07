/** Letter-by-letter spelling for voice read-back (e.g. "a-t" for local parts). */
function spellSegment(segment: string): string {
  return segment.split("").join("-");
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
  const domainSpoken = domain.split(".").map(spellSegment).join(" dot ");
  return `${spellSegment(local)} at ${domainSpoken}`;
}
