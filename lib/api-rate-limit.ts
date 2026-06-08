import type { NextRequest } from "next/server";
import {
  checkRateLimit,
  pruneRateLimitStore,
  type RateLimitConfig,
} from "@/lib/rate-limit";
import { checkRateLimitSupabase } from "@/lib/rate-limit-supabase";
import { supabaseAdmin } from "@/lib/supabase";

export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/leads": { limit: 5, windowMs: 60_000 },
  "/api/contact": { limit: 10, windowMs: 60_000 },
  "/api/hosting/portal/request": { limit: 5, windowMs: 60_000 },
  "/api/admin/env-status": { limit: 5, windowMs: 60_000 },
  "/api/crm/session": { limit: 10, windowMs: 60_000 },
  "/api/crm/feed": { limit: 60, windowMs: 60_000 },
  "/api/discovery/start": { limit: 8, windowMs: 60_000 },
  "/api/discovery/verify-sms": { limit: 12, windowMs: 60_000 },
  "/api/discovery/intake": { limit: 8, windowMs: 60_000 },
  "/api/discovery/close-checkout": { limit: 5, windowMs: 60_000 },
  "/api/voice-demo/start": { limit: 6, windowMs: 60_000 },
  "/api/voice-demo/plumbing/start": { limit: 6, windowMs: 60_000 },
  "/api/voice-demo/verify-code": { limit: 15, windowMs: 60_000 },
  "/api/voice-demo/live-token": { limit: 20, windowMs: 60_000 },
  "/api/voice-demo/tool": { limit: 40, windowMs: 60_000 },
  "/api/voice-demo/ops-event": { limit: 60, windowMs: 60_000 },
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

  const memory = checkRateLimit(key, config);
  if (!memory.allowed) {
    return memory;
  }

  const distributed = await checkRateLimitSupabase(key, config);
  if (distributed.usedDatabase) {
    return {
      allowed: distributed.allowed,
      retryAfterSec: distributed.retryAfterSec,
    };
  }

  return memory;
}

/** Admin bearer routes: fail closed when Supabase is configured but rate-limit table is unreachable. */
export async function enforceAdminRateLimit(
  req: NextRequest,
  path: "/api/admin/env-status"
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

  if (supabaseAdmin()) {
    console.error("[rate-limit] Admin route denied — distributed limit unavailable");
    return { allowed: false, retryAfterSec: 60 };
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
