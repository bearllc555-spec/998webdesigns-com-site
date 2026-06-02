/**
 * In-memory sliding window rate limiter for Edge middleware.
 * Per-isolate only (not global across Vercel regions). Still blocks burst abuse.
 */

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __apiRateLimit?: Map<string, Bucket>;
};

function store(): Map<string, Bucket> {
  if (!globalStore.__apiRateLimit) {
    globalStore.__apiRateLimit = new Map();
  }
  return globalStore.__apiRateLimit;
}

export type RateLimitConfig = {
  /** Max requests per window */
  limit: number;
  /** Window length in ms */
  windowMs: number;
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const map = store();
  const entry = map.get(key);

  if (!entry || now >= entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.limit) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true };
}

/** Prune expired keys occasionally so the map does not grow without bound. */
export function pruneRateLimitStore(maxAgeMs = 120_000): void {
  const now = Date.now();
  const map = store();
  for (const [key, bucket] of map) {
    if (now >= bucket.resetAt + maxAgeMs) {
      map.delete(key);
    }
  }
}
