const WORD_TO_DIGIT: Record<string, string> = {
  zero: "0",
  oh: "0",
  o: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

/** Normalize spoken or typed verification codes to digits only. */
export function normalizeVerificationCode(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (/^\d+$/.test(trimmed.replace(/\s+/g, ""))) {
    return trimmed.replace(/\D/g, "");
  }

  const parts = trimmed.split(/[\s,-]+/).filter(Boolean);
  let out = "";
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      out += part;
      continue;
    }
    const digit = WORD_TO_DIGIT[part];
    if (digit) out += digit;
  }
  return out.replace(/\D/g, "");
}

export function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
