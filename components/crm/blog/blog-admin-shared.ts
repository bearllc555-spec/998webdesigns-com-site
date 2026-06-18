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
