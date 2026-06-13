/**
 * Indexable marketing routes only.
 * Excluded from sitemap + robots: /thanks (post-checkout, noindex), /api/* (non-page).
 * Bump SITEMAP_LAST_MODIFIED when these pages change materially.
 */
export const SITEMAP_LAST_MODIFIED = "2026-06-07";

export const INDEXABLE_ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/portfolio", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/start", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/book", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/hosting/manage", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/legal/terms", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/legal/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/legal/sms-opt-in", changeFrequency: "monthly" as const, priority: 0.3 },
];

/** Paths crawlers should not fetch (keep in sync with sitemap). */
export const ROBOTS_DISALLOW = ["/thanks", "/api/", "/crm", "/temp", "/close", "/book/intake", "/book/schedule"];
