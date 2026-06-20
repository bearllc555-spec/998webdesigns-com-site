import { DISCOVERY_BOOK_CALL_URL } from "@/lib/book-call";

export type DiscoveryBookCallPrefill = {
  fullName: string;
  email: string;
  prospectId: string;
};

/** Calendly event URL with prefill + utm_campaign=prospect id for webhook matching. */
export function buildDiscoveryBookCallUrl(prefill: DiscoveryBookCallPrefill): string {
  const base = process.env.NEXT_PUBLIC_BOOK_CALL_URL?.trim() || DISCOVERY_BOOK_CALL_URL;
  const url = new URL(base);
  url.searchParams.set("name", prefill.fullName.trim());
  url.searchParams.set("email", prefill.email.trim());
  url.searchParams.set("utm_campaign", prefill.prospectId);
  url.searchParams.set("utm_source", "998webdesigns");
  url.searchParams.set("utm_medium", "discovery");
  return url.toString();
}

export function discoveryProspectIdFromCalendlyTracking(
  tracking: Record<string, unknown> | null | undefined
): string | null {
  if (!tracking || typeof tracking !== "object") return null;
  const raw = tracking.utm_campaign;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formatDiscoveryCallWhen(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}
