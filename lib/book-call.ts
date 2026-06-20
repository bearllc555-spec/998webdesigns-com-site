/** Canonical discovery Calendly event (production default). */
export const DISCOVERY_BOOK_CALL_URL =
  "https://calendly.com/998webdesigns/discovery-call-998-web-designs";

/**
 * Calendly URL for /book/schedule redirect and discovery UI.
 * Production: leave NEXT_PUBLIC_BOOK_CALL_URL unset so this canonical URL is used.
 * Preview/local only: set NEXT_PUBLIC_BOOK_CALL_URL to a test event if needed.
 */
export function discoveryBookCallUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BOOK_CALL_URL?.trim();
  return fromEnv || DISCOVERY_BOOK_CALL_URL;
}
