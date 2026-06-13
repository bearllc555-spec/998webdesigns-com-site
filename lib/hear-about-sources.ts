/** Lead form - "Where did you hear about us?" checkbox options. */
export const HEAR_ABOUT_SOURCES = [
  "LinkedIn",
  "X.com",
  "AI search",
  "Google search",
  "Other",
] as const;

export type HearAboutSource = (typeof HEAR_ABOUT_SOURCES)[number];

const ALLOWED = new Set<string>(HEAR_ABOUT_SOURCES);

export function filterHearAboutSources(values: unknown): HearAboutSource[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<HearAboutSource>();
  const out: HearAboutSource[] = [];
  for (const v of values) {
    if (typeof v !== "string" || !ALLOWED.has(v)) continue;
    const source = v as HearAboutSource;
    if (seen.has(source)) continue;
    seen.add(source);
    out.push(source);
  }
  return out;
}

export function formatHearAboutSources(
  sources: HearAboutSource[],
  otherDetail?: string
): string {
  if (sources.length === 0) return "";
  const parts: string[] = [...sources];
  const other = otherDetail?.trim();
  if (sources.includes("Other") && other) {
    const idx = parts.indexOf("Other");
    if (idx >= 0) parts[idx] = `Other (${other})`;
  }
  return parts.join(", ");
}
