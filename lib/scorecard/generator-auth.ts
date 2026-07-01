import { NextRequest } from "next/server";

/** VPS / Door 1 scorecard generator → Next.js (x-generator-key). */
export function verifyScorecardGeneratorKey(req: NextRequest): boolean {
  const expected = process.env.GENERATOR_API_KEY?.trim();
  if (!expected) return false;
  const provided = req.headers.get("x-generator-key")?.trim();
  return provided === expected;
}
