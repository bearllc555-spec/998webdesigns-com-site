const TRADE_KEYWORDS: ReadonlyArray<[RegExp, string]> = [
  [/plumb|drain|sewer|pipe|water heater/i, "plumbing"],
  [/hvac|heating|cooling|air condition/i, "hvac"],
  [/electric/i, "electrician"],
  [/roof/i, "roofing"],
  [/landscap|lawn|mower/i, "landscaping"],
  [/clean/i, "cleaning"],
];

export const SCORECARD_INDUSTRY_VALUES = [
  "plumbing",
  "electrician",
  "roofing",
  "landscaping",
  "hvac",
  "cleaning",
  "other",
] as const;

export type ScorecardIndustryValue = (typeof SCORECARD_INDUSTRY_VALUES)[number];

export const SCORECARD_INDUSTRY_OPTIONS: ReadonlyArray<{
  value: ScorecardIndustryValue;
  label: string;
  searchTerm: string;
}> = [
  { value: "plumbing", label: "Plumbing", searchTerm: "plumbing" },
  { value: "electrician", label: "Electrician", searchTerm: "electrician" },
  { value: "roofing", label: "Roofing", searchTerm: "roofing" },
  { value: "landscaping", label: "Landscaping", searchTerm: "landscaping" },
  { value: "hvac", label: "HVAC", searchTerm: "hvac" },
  { value: "cleaning", label: "Cleaning", searchTerm: "cleaning" },
  { value: "other", label: "Other", searchTerm: "" },
];

const SEARCH_BY_VALUE = Object.fromEntries(
  SCORECARD_INDUSTRY_OPTIONS.filter((o) => o.value !== "other").map((o) => [o.value, o.searchTerm])
) as Record<Exclude<ScorecardIndustryValue, "other">, string>;

export function isScorecardIndustryValue(v: string): v is ScorecardIndustryValue {
  return (SCORECARD_INDUSTRY_VALUES as readonly string[]).includes(v);
}

export function validateScorecardIndustryInput(
  industry: unknown,
  industryOther: unknown
):
  | { ok: true; industry: ScorecardIndustryValue; industryOther: string | null }
  | { ok: false; error: string } {
  const ind = String(industry ?? "").trim();
  if (!ind || !isScorecardIndustryValue(ind)) {
    return { ok: false, error: "Please select your industry." };
  }
  const other = String(industryOther ?? "").trim();
  if (ind === "other") {
    if (other.length < 2) {
      return { ok: false, error: "Please describe your industry." };
    }
    if (other.length > 60) {
      return { ok: false, error: "Industry description is too long." };
    }
    return { ok: true, industry: ind, industryOther: other };
  }
  return { ok: true, industry: ind, industryOther: null };
}

export function scorecardIndustryLabel(
  industry: string | null | undefined,
  industryOther: string | null | undefined
): string | null {
  const ind = String(industry ?? "").trim();
  if (!ind) return null;
  if (ind === "other") {
    return industryOther?.trim() || "Other";
  }
  return SCORECARD_INDUSTRY_OPTIONS.find((o) => o.value === ind)?.label ?? ind;
}

/** Awwwards `?text=` value — form industry wins, else keyword guess from name/domain. */
export function resolveScorecardIndustrySearch(input: {
  industry?: string | null;
  industryOther?: string | null;
  businessName?: string;
  domain?: string;
}): string {
  const ind = String(input.industry ?? "").trim();
  if (ind && ind !== "other" && ind in SEARCH_BY_VALUE) {
    return SEARCH_BY_VALUE[ind as Exclude<ScorecardIndustryValue, "other">];
  }
  if (ind === "other" && input.industryOther?.trim()) {
    return input.industryOther.trim().toLowerCase();
  }
  return inferScorecardTradeFromText(input.businessName ?? "", input.domain ?? "");
}

function inferScorecardTradeFromText(businessName: string, domain: string): string {
  const hay = `${businessName} ${domain}`.toLowerCase();
  for (const [re, term] of TRADE_KEYWORDS) {
    if (re.test(hay)) return term;
  }
  return "plumbing";
}

/** @deprecated use resolveScorecardIndustrySearch */
export function inferScorecardTrade(businessName: string, domain: string): string {
  return inferScorecardTradeFromText(businessName, domain);
}

export function awwwardsTradeSearchUrl(trade: string): string {
  return `https://www.awwwards.com/websites/?text=${encodeURIComponent(trade.toLowerCase())}`;
}
