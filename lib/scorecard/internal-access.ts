import { isProtectedScorecardDomain } from "@/lib/scorecard/protected-domains";
import { isEmail } from "@/lib/scorecard/validate";

/** Always allowed without SCORECARD_INTERNAL_EMAILS env (operator inbox). */
const DEFAULT_INTERNAL_EMAILS = ["bearllc555@gmail.com"] as const;

function internalEmailSet(): Set<string> {
  const fromEnv = (process.env.SCORECARD_INTERNAL_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_INTERNAL_EMAILS, ...fromEnv]);
}

/** Team may scan protected domains via the public form (Door 2). Door 1 (/generate) unchanged. */
export function isInternalScorecardEmail(raw: unknown): boolean {
  const email = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!isEmail(email)) return false;
  if (email.endsWith("@998webdesigns.com")) return true;
  return internalEmailSet().has(email);
}

/** Skip domain/IP rate limits and worker dedup for operator scans of our own site. */
export function isInternalProtectedScorecardBypass(
  email: unknown,
  domain: unknown
): boolean {
  return isInternalScorecardEmail(email) && isProtectedScorecardDomain(domain);
}
