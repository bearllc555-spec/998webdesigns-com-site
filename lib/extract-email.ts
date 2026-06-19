const EMAIL_RE =
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\b/g;

const IGNORE_DOMAINS = new Set([
  "linkedin.com",
  "openoutreach.app",
  "example.com",
  "test.com",
]);

export type ExtractedEmail = {
  email: string;
  snippet: string;
};

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isUsableEmail(email: string): boolean {
  const domain = email.split("@")[1];
  if (!domain) return false;
  if (IGNORE_DOMAINS.has(domain)) return false;
  return true;
}

/** First usable email found in text (case-insensitive). */
export function extractFirstEmail(text: string): ExtractedEmail | null {
  if (!text?.trim()) return null;
  const matches = text.match(EMAIL_RE);
  if (!matches?.length) return null;

  for (const match of matches) {
    const email = normalizeEmail(match);
    if (!isUsableEmail(email)) continue;
    const idx = text.toLowerCase().indexOf(email);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + email.length + 40);
    const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
    return { email, snippet };
  }

  return null;
}
