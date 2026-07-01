import { normDomain } from "@/lib/scorecard/validate";

/** Domains we own — public scorecard form must not scan these. Door 1 (/generate + key) still can. */
export const SCORECARD_PROTECTED_ROOTS = ["998webdesigns.com"] as const;

export function isProtectedScorecardDomain(raw: unknown): boolean {
  const domain = normDomain(raw);
  if (!domain) return false;
  return SCORECARD_PROTECTED_ROOTS.some(
    (root) => domain === root || domain.endsWith(`.${root}`)
  );
}
