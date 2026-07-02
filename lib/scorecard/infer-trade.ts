const TRADE_KEYWORDS: ReadonlyArray<[RegExp, string]> = [
  [/plumb|drain|sewer|pipe|water heater/i, "Plumbing"],
  [/hvac|heating|cooling|air condition/i, "HVAC"],
  [/electric/i, "Electrician"],
  [/roof/i, "Roofing"],
  [/landscap|lawn|mower/i, "Landscaping"],
];

/** Infer trade label for design-intel benchmarks (scorecard defaults to Plumbing). */
export function inferScorecardTrade(businessName: string, domain: string): string {
  const hay = `${businessName} ${domain}`.toLowerCase();
  for (const [re, trade] of TRADE_KEYWORDS) {
    if (re.test(hay)) return trade;
  }
  return "Plumbing";
}

export function awwwardsTradeSearchUrl(trade: string): string {
  return `https://www.awwwards.com/websites/search/?text=${encodeURIComponent(trade)}`;
}
