import type { Metadata } from "next";

/** Canonical marketing origin (apex, non-www). */
export const SITE_ORIGIN = "https://998webdesigns.com";

/** Cloudflare Workers staging host (synced with main on every deploy). */
export const DEV_SITE_ORIGIN = "https://dev.998webdesigns.com";

/** Canonical marketing origin for links in transactional email. */
export function marketingSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return SITE_ORIGIN;
}

/** Absolute URL for a site path (`/` or `/portfolio`, etc.). */
export function siteUrl(path = ""): string {
  const origin = marketingSiteOrigin();
  if (!path || path === "/") return origin;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

/** Add `<link rel="canonical">` and align `og:url` with the canonical host. */
export function withSiteSeo(path: string, meta: Metadata): Metadata {
  const canonical =
    !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const url = siteUrl(canonical === "/" ? "" : canonical);
  return {
    ...meta,
    alternates: { canonical },
    openGraph: meta.openGraph ? { ...meta.openGraph, url } : { url },
  };
}
