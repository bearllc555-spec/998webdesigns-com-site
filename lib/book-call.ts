/** Canonical discovery Calendly event (production default). */
export const DISCOVERY_BOOK_CALL_URL =
  "https://calendly.com/998webdesigns/discovery-call-998-web-designs";

/**
 * Calendly URL for /book/schedule redirect and discovery UI.
 * Production always uses the canonical org event — stale NEXT_PUBLIC_BOOK_CALL_URL
 * on Vercel (e.g. old bearllc555 slug) caused Calendly "Page not found" embeds.
 * Preview/local only: set NEXT_PUBLIC_BOOK_CALL_URL to a test event if needed.
 */
export function discoveryBookCallUrl(): string {
  if (process.env.VERCEL_ENV === "production") {
    return DISCOVERY_BOOK_CALL_URL;
  }
  const fromEnv = process.env.NEXT_PUBLIC_BOOK_CALL_URL?.trim();
  return fromEnv || DISCOVERY_BOOK_CALL_URL;
}
