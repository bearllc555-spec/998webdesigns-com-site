/** US national digits from E.164, spaced for voice read-back (e.g. "2 0 1 5 5 5 1 2 3 4"). */
export function spellPhoneForVoice(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  const national =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits.slice(-10);
  return national.split("").join(" ");
}
