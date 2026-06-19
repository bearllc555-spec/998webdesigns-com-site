/** Discovery pipeline scheduling link (/book/schedule). */
export const DISCOVERY_BOOK_CALL_URL =
  "https://calendly.com/bearllc555/discovery-call-998-web-designs";

/** NEXT_PUBLIC_BOOK_CALL_URL overrides for staging; production default is bearllc555 Calendly. */
export function discoveryBookCallUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BOOK_CALL_URL?.trim();
  return fromEnv || DISCOVERY_BOOK_CALL_URL;
}
