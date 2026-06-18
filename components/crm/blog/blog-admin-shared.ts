import type { BlogDashboardPost, BlogStatus } from "@/lib/blog-store";

export type { BlogDashboardPost, BlogStatus };

export const STATUS_ORDER: BlogStatus[] = ["draft", "scheduled", "published", "archived"];

export const STATUS_LABEL: Record<BlogStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export const STATUS_BADGE: Record<BlogStatus, string> = {
  draft: "bg-rule-soft text-slate",
  scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  archived: "bg-rule-soft text-ink-soft line-through",
};

/**
 * Editorial posting order from content/blog/00-posting-sequence-all-30.md,
 * keyed by the live DB slug. Drives dashboard ordering so the next article to
 * post sits at the top of its section. Gaps (#5, #17, #25) are articles not yet
 * written/imported. Posts not listed here (e.g. the original 3) sort after.
 */
export const POST_SEQUENCE: Record<string, number> = {
  "why-isn-t-my-plumbing-business-showing-up-on-google": 1,
  "how-to-get-more-roofing-leads-without-buying-them-from-a-lead-service": 2,
  "how-much-should-a-plumbing-or-roofing-website-cost-in-2026": 3,
  "do-plumbers-really-need-a-website-if-most-work-comes-from-referrals": 4,
  "what-actually-makes-a-plumbing-website-convert-visitors-into-calls": 6,
  "why-is-my-contractor-website-so-slow-on-phones-and-why-it-matters": 7,
  "how-to-get-more-google-reviews-for-your-plumbing-or-roofing-business": 8,
  "how-to-claim-and-verify-your-google-business-profile-step-by-step": 9,
  "7-roofing-website-mistakes-that-quietly-cost-you-jobs": 10,
  "what-pages-does-a-plumbing-website-actually-need": 11,
  "website-or-google-business-profile-which-should-a-contractor-do-first": 12,
  "diy-website-builder-vs-hiring-a-pro-which-is-right-for-a-contractor": 13,
  "how-to-get-customers-to-leave-reviews-with-photos-and-why-it-matters": 14,
  "what-is-a-good-website-actually-worth-to-a-plumber-the-math": 15,
  "missed-calls-are-costing-roofers-jobs-is-an-ai-receptionist-the-fix": 16,
  "how-to-win-jobs-when-a-competitor-always-undercuts-your-price": 18,
  "what-to-look-for-when-hiring-someone-to-build-your-contractor-website": 19,
  "how-long-does-it-take-to-build-a-contractor-website": 20,
  "what-is-local-seo-and-does-my-plumbing-or-roofing-business-need-it": 21,
  "do-i-need-a-website-or-is-a-facebook-page-enough-for-my-trade-business": 22,
  "can-an-ai-chatbot-actually-help-a-plumbing-or-roofing-website": 23,
  "should-roofers-offer-online-booking-or-stick-to-phone-calls": 24,
  "do-i-need-a-separate-page-for-each-town-i-serve": 26,
  "how-to-get-a-brand-new-contractor-website-found-on-google-faster": 27,
  "is-it-worth-paying-for-google-ads-as-a-plumber-or-roofer": 28,
  "how-often-should-a-plumbing-or-roofing-business-blog-if-at-all": 29,
  "why-storm-season-is-when-a-roofer-s-website-matters-most": 30,
};

/** Sequence number for a slug, or null if it is not part of the editorial run. */
export function postSequence(slug: string): number | null {
  return POST_SEQUENCE[slug] ?? null;
}

/**
 * Order posts by editorial sequence (ascending), then newest-first for anything
 * outside the run. Lowest sequence = next to post = top of the list.
 */
export function compareBySequence(a: BlogDashboardPost, b: BlogDashboardPost): number {
  const sa = POST_SEQUENCE[a.slug] ?? Number.POSITIVE_INFINITY;
  const sb = POST_SEQUENCE[b.slug] ?? Number.POSITIVE_INFINITY;
  if (sa !== sb) return sa - sb;
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

/** Pre-fill a datetime-local input value from a JS Date (local browser time). */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
