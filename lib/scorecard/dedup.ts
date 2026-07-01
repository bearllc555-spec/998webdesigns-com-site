/** Matches worker `DEDUP_DAYS` / domain rate-limit window (default 14). */
export const SCORECARD_DEDUP_DAYS =
  Math.max(1, Number(process.env.SCORECARD_DEDUP_DAYS ?? "14") || 14);

function reportAnchorDate(report: { created_at?: string; tested_on?: string }): Date | null {
  if (report.created_at) {
    const d = new Date(report.created_at);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (report.tested_on) {
    const d = new Date(`${report.tested_on}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** Copy for the report footer — days until the same domain can be rescored via the form. */
export function scorecardRerunMessage(report: {
  created_at?: string;
  tested_on?: string;
}): string | null {
  const anchor = reportAnchorDate(report);
  if (!anchor) return null;

  const eligible = new Date(anchor);
  eligible.setUTCDate(eligible.getUTCDate() + SCORECARD_DEDUP_DAYS);

  const dateStr = eligible.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const msLeft = eligible.getTime() - Date.now();
  if (msLeft <= 0) {
    return "You can request a fresh scorecard for this site anytime at 998webdesigns.com/scorecard.";
  }

  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  const dayWord = daysLeft === 1 ? "day" : "days";
  return `You could run this report again in ${daysLeft} ${dayWord} on ${dateStr}.`;
}
