import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import type { RateLimitConfig } from "@/lib/rate-limit";

export type DistributedRateLimitResult = {
  allowed: boolean;
  retryAfterSec?: number;
  /** True when Postgres enforced the limit (shared across all Vercel instances). */
  usedDatabase: boolean;
};

/**
 * Sliding-window rate limit stored in Supabase (table api_rate_limits).
 * Falls back to caller when Supabase is unavailable.
 */
export async function checkRateLimitSupabase(
  key: string,
  config: RateLimitConfig
): Promise<DistributedRateLimitResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return { allowed: true, usedDatabase: false };
  }

  try {
    return await checkWithClient(supa, key, config);
  } catch (err) {
    console.error("[rate-limit] Supabase check failed — using in-memory fallback:", err);
    return { allowed: true, usedDatabase: false };
  }
}

async function checkWithClient(
  supa: SupabaseClient,
  key: string,
  config: RateLimitConfig
): Promise<DistributedRateLimitResult> {
  const now = new Date();
  const { data: row, error: selectError } = await supa
    .from("api_rate_limits")
    .select("hit_count, window_ends_at")
    .eq("rate_key", key)
    .maybeSingle();

  if (selectError) {
    if (isMissingTableError(selectError)) {
      console.error(
        "[rate-limit] api_rate_limits table missing — run supabase/schema.sql in Supabase SQL editor"
      );
    }
    return { allowed: true, usedDatabase: false };
  }

  const windowEnded = !row || new Date(row.window_ends_at) <= now;

  if (windowEnded) {
    const windowEndsAt = new Date(now.getTime() + config.windowMs).toISOString();
    const { error: upsertError } = await supa.from("api_rate_limits").upsert({
      rate_key: key,
      hit_count: 1,
      window_ends_at: windowEndsAt,
    });

    if (upsertError) {
      console.warn("[rate-limit] upsert failed:", upsertError.message);
      return { allowed: true, usedDatabase: false };
    }
    return { allowed: true, usedDatabase: true };
  }

  if (row.hit_count >= config.limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((new Date(row.window_ends_at).getTime() - now.getTime()) / 1000)
    );
    return { allowed: false, retryAfterSec, usedDatabase: true };
  }

  const { error: updateError } = await supa
    .from("api_rate_limits")
    .update({ hit_count: row.hit_count + 1 })
    .eq("rate_key", key);

  if (updateError) {
    console.warn("[rate-limit] increment failed:", updateError.message);
    return { allowed: true, usedDatabase: false };
  }

  return { allowed: true, usedDatabase: true };
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const msg = error.message ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /api_rate_limits/i.test(msg) ||
    /schema cache/i.test(msg)
  );
}
