import type { NextRequest } from "next/server";
import {
  checkRateLimit,
  pruneRateLimitStore,
  type RateLimitConfig,
} from "@/lib/rate-limit";
import { checkRateLimitSupabase } from "@/lib/rate-limit-supabase";

export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/leads": { limit: 5, windowMs: 60_000 },
  "/api/contact": { limit: 10, windowMs: 60_000 },
  /** Shared bucket for admin bearer routes (capture + env-status). */
  "/api/admin/capture-balance": { limit: 5, windowMs: 60_000 },
};

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Edge proxy uses in-memory limits; API routes also enforce via Supabase when configured.
 */
export async function enforceApiRateLimit(
  req: NextRequest,
  path: keyof typeof API_RATE_LIMITS
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const config = API_RATE_LIMITS[path];
  const key = `${path}:${clientIp(req)}`;

  pruneRateLimitStore();

  const distributed = await checkRateLimitSupabase(key, config);
  if (distributed.usedDatabase) {
    return {
      allowed: distributed.allowed,
      retryAfterSec: distributed.retryAfterSec,
    };
  }

  return checkRateLimit(key, config);
}

export function rateLimitResponse(retryAfterSec?: number) {
  return {
    error: "Too many requests. Please try again later.",
    status: 429 as const,
    headers: { "Retry-After": String(retryAfterSec ?? 60) },
  };
}
