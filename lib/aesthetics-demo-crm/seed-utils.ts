/** Convert tMinusHours (hours before now) to ISO timestamp. Negative = future. */
export function anchorTMinusHours(tMinusHours: number, now = Date.now()): string {
  return new Date(now - tMinusHours * 60 * 60 * 1000).toISOString();
}

/** Skew appointment into Tue-Sat 10am-7pm local (America/New_York). */
export function skewAppointmentTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay();
  if (day === 0) d.setUTCDate(d.getUTCDate() + 2);
  if (day === 1) d.setUTCDate(d.getUTCDate() + 1);
  const hour = d.getUTCHours();
  if (hour < 14) d.setUTCHours(15, 0, 0, 0);
  if (hour >= 23) d.setUTCHours(20, 0, 0, 0);
  return d.toISOString();
}

export function nextEntityId(prefix: string, existing: { id: string }[]): string {
  const nums = existing
    .map((r) => {
      const m = r.id.match(/-(\d+)$/);
      return m ? Number(m[1]) : 0;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `${prefix}-${next}`;
}
