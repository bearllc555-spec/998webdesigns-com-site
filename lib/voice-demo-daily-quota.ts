import { supabaseAdmin } from "@/lib/supabase";

/** Default voice demos per email per calendar day (Eastern Time). */
export const VOICE_DEMO_DAILY_MAX_DEFAULT = 3;

export const VOICE_DEMO_DAILY_LIMIT_MESSAGE =
  "You have used today's voice demo limit. Try again tomorrow, or email hello@998webdesigns.com.";

/** Operator / QA emails — always unlimited; env allowlist merges on top. */
export const VOICE_DEMO_BUILTIN_ALLOWLIST_EMAILS = ["ademeo@gmail.com"] as const;

export function voiceDemoDailyMax(): number {
  const raw = process.env.VOICE_DEMO_DAILY_MAX?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : VOICE_DEMO_DAILY_MAX_DEFAULT;
  if (!Number.isFinite(parsed) || parsed < 1) return VOICE_DEMO_DAILY_MAX_DEFAULT;
  return Math.min(parsed, 20);
}

export function normalizeQuotaEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.includes("@") ? normalized : null;
}

function parseCsvSet(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function parseVoiceDemoAllowlistEmails(): Set<string> {
  const merged = new Set<string>(VOICE_DEMO_BUILTIN_ALLOWLIST_EMAILS);
  for (const email of parseCsvSet(process.env.VOICE_DEMO_ALLOWLIST_EMAILS)) {
    merged.add(email);
  }
  return merged;
}

export function parseVoiceDemoAllowlistIps(): Set<string> {
  const ips = new Set<string>();
  for (const part of process.env.VOICE_DEMO_ALLOWLIST_IPS?.split(",") ?? []) {
    const ip = part.trim();
    if (ip) ips.add(ip);
  }
  return ips;
}

export function isVoiceDemoAllowlisted(opts: {
  email?: string | null;
  ip?: string | null;
}): boolean {
  const email = normalizeQuotaEmail(opts.email);
  if (email && parseVoiceDemoAllowlistEmails().has(email)) return true;
  const ip = opts.ip?.trim();
  if (ip && parseVoiceDemoAllowlistIps().has(ip)) return true;
  return false;
}

/** Calendar date in America/New_York (YYYY-MM-DD). */
export function etDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

export function msUntilNextEtMidnight(now = new Date()): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  return ((23 - hour) * 3600 + (59 - minute) * 60 + (59 - second) + 1) * 1000;
}

function emailDailyKey(email: string, dateKey: string): string {
  return `voice-demo-daily:${email}:${dateKey}`;
}

function leadSlotKey(leadId: string, dateKey: string): string {
  return `voice-demo-lead-slot:${leadId}:${dateKey}`;
}

export type VoiceDemoDailyQuotaStatus = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  allowlisted: boolean;
  dateKey: string;
  retryAfterSec?: number;
};

type RateRow = { hit_count: number; window_ends_at: string };

async function readActiveRow(key: string): Promise<RateRow | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const now = new Date();
  const { data, error } = await supa
    .from("api_rate_limits")
    .select("hit_count, window_ends_at")
    .eq("rate_key", key)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.window_ends_at) <= now) return null;
  return data as RateRow;
}

async function readHitCount(key: string): Promise<number> {
  const row = await readActiveRow(key);
  return row?.hit_count ?? 0;
}

async function upsertHitCount(key: string, hitCount: number): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return true;

  const now = new Date();
  const windowEndsAt = new Date(now.getTime() + msUntilNextEtMidnight(now)).toISOString();
  const { error } = await supa.from("api_rate_limits").upsert({
    rate_key: key,
    hit_count: hitCount,
    window_ends_at: windowEndsAt,
  });

  return !error;
}

async function incrementHitCount(key: string): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) return true;

  const now = new Date();
  const row = await readActiveRow(key);
  if (!row) {
    return upsertHitCount(key, 1);
  }

  const { error } = await supa
    .from("api_rate_limits")
    .update({ hit_count: row.hit_count + 1 })
    .eq("rate_key", key);

  return !error;
}

async function markLeadSlotReserved(leadId: string, dateKey: string): Promise<void> {
  await upsertHitCount(leadSlotKey(leadId, dateKey), 1);
}

async function leadSlotReservedToday(leadId: string, dateKey: string): Promise<boolean> {
  return (await readHitCount(leadSlotKey(leadId, dateKey))) > 0;
}

function buildQuotaStatus(opts: {
  used: number;
  limit: number;
  allowlisted: boolean;
  dateKey: string;
}): VoiceDemoDailyQuotaStatus {
  const remaining = Math.max(0, opts.limit - opts.used);
  const allowed = opts.allowlisted || opts.used < opts.limit;
  return {
    allowed,
    used: opts.allowlisted ? 0 : opts.used,
    limit: opts.limit,
    remaining: opts.allowlisted ? opts.limit : remaining,
    allowlisted: opts.allowlisted,
    dateKey: opts.dateKey,
    retryAfterSec: allowed ? undefined : Math.ceil(msUntilNextEtMidnight() / 1000),
  };
}

/** Read-only check (start gate, status UI). */
export async function getVoiceDemoDailyQuotaStatus(
  email: string | null | undefined,
  opts?: { ip?: string | null }
): Promise<VoiceDemoDailyQuotaStatus> {
  const normalized = normalizeQuotaEmail(email);
  const limit = voiceDemoDailyMax();
  const dateKey = etDateKey();
  const allowlisted = isVoiceDemoAllowlisted({ email: normalized, ip: opts?.ip });

  if (!normalized || allowlisted) {
    return buildQuotaStatus({ used: 0, limit, allowlisted, dateKey });
  }

  const used = await readHitCount(emailDailyKey(normalized, dateKey));
  return buildQuotaStatus({ used, limit, allowlisted: false, dateKey });
}

/**
 * Reserve one demo slot when issuing a live token.
 * Reconnects for the same lead on the same day do not consume another slot.
 */
export async function reserveVoiceDemoDailySlot(opts: {
  email: string | null | undefined;
  leadId: string;
  ip?: string | null;
}): Promise<VoiceDemoDailyQuotaStatus & { reserved: boolean }> {
  const normalized = normalizeQuotaEmail(opts.email);
  const limit = voiceDemoDailyMax();
  const dateKey = etDateKey();
  const allowlisted = isVoiceDemoAllowlisted({ email: normalized, ip: opts.ip });

  if (allowlisted) {
    await markLeadSlotReserved(opts.leadId, dateKey);
    const status = buildQuotaStatus({ used: 0, limit, allowlisted: true, dateKey });
    return { ...status, reserved: true };
  }

  if (!normalized) {
    const status = buildQuotaStatus({ used: 0, limit, allowlisted: false, dateKey });
    return { ...status, allowed: false, remaining: 0, reserved: false };
  }

  const emailKey = emailDailyKey(normalized, dateKey);
  const alreadyReservedForLead = await leadSlotReservedToday(opts.leadId, dateKey);
  const used = await readHitCount(emailKey);

  if (alreadyReservedForLead) {
    const status = buildQuotaStatus({ used, limit, allowlisted: false, dateKey });
    return { ...status, reserved: false };
  }

  if (used >= limit) {
    const status = buildQuotaStatus({ used, limit, allowlisted: false, dateKey });
    return { ...status, reserved: false };
  }

  await incrementHitCount(emailKey);
  await markLeadSlotReserved(opts.leadId, dateKey);

  const status = buildQuotaStatus({ used: used + 1, limit, allowlisted: false, dateKey });
  return { ...status, reserved: true };
}
