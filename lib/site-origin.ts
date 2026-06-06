/** Canonical marketing origin for links in transactional email. */
export function marketingSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://998webdesigns.com";
}
