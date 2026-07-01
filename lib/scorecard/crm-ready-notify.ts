import { notifyCrmActivity } from "@/lib/crm-notify";
import { supabaseAdmin } from "@/lib/supabase";

export type ScorecardReadyNotifyInput = {
  reportId: string;
  token: string;
  domain: string;
  score: number;
  verdict?: string;
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  deduped?: boolean;
};

const REPORT_BASE = "https://998webdesigns.com";

/** Send scorecard_ready Telegram once per report (set crm_ready_notified_at only after delivery). */
export async function notifyScorecardReadyOnce(
  input: ScorecardReadyNotifyInput
): Promise<boolean> {
  const supa = supabaseAdmin();
  if (!supa) {
    console.warn("[scorecard-ready-notify] Supabase admin unavailable");
    return false;
  }

  const { data: existing, error: readError } = await supa
    .from("scorecard_reports")
    .select("crm_ready_notified_at")
    .eq("id", input.reportId)
    .maybeSingle();

  if (readError) {
    if (/crm_ready_notified_at|does not exist/i.test(readError.message)) {
      console.warn(
        "[scorecard-ready-notify] column missing - run 20260702180000_scorecard_crm_ready_notify.sql"
      );
    } else {
      console.warn("[scorecard-ready-notify] read failed:", readError.message);
    }
    return false;
  }

  if (existing?.crm_ready_notified_at) {
    return false;
  }

  const delivered = await notifyCrmActivity({
    kind: "scorecard_ready",
    fullName: input.fullName?.trim() || undefined,
    businessName: input.businessName?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    domain: input.domain,
    score: input.score,
    verdict: input.verdict?.trim() || undefined,
    deduped: Boolean(input.deduped),
    reportUrl: `${REPORT_BASE}/r/${input.token}`,
    internalReportUrl: `${REPORT_BASE}/crm/scorecard/r/${input.token}`,
  });

  if (!delivered) {
    console.warn("[scorecard-ready-notify] telegram delivery failed for", input.reportId);
    return false;
  }

  const now = new Date().toISOString();
  const { data: marked, error: markError } = await supa
    .from("scorecard_reports")
    .update({ crm_ready_notified_at: now })
    .eq("id", input.reportId)
    .is("crm_ready_notified_at", null)
    .select("id")
    .maybeSingle();

  if (markError) {
    console.warn("[scorecard-ready-notify] mark notified failed:", markError.message);
    return delivered;
  }

  return Boolean(marked?.id);
}

/** Reports ready but never Telegram-notified (VPS env gap, closed browser, etc.). */
export async function backfillScorecardReadyTelegram(limit = 15): Promise<number> {
  const supa = supabaseAdmin();
  if (!supa) return 0;

  const cutoff = new Date(Date.now() - 45 * 1000).toISOString();

  const { data: rows, error } = await supa
    .from("scorecard_reports")
    .select(
      "id, token, domain, business_name, score, verdict, lead_id, created_at, leads ( full_name, email, phone )"
    )
    .eq("status", "active")
    .is("crm_ready_notified_at", null)
    .lte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/crm_ready_notified_at|does not exist/i.test(error.message)) {
      console.warn("[scorecard-ready-notify] backfill skipped - migration not applied");
      return 0;
    }
    console.warn("[scorecard-ready-notify] backfill query failed:", error.message);
    return 0;
  }

  let sent = 0;
  for (const row of rows ?? []) {
    const leadRaw = row.leads as
      | { full_name?: string | null; email?: string | null; phone?: string | null }
      | { full_name?: string | null; email?: string | null; phone?: string | null }[]
      | null;
    const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;
    const ok = await notifyScorecardReadyOnce({
      reportId: row.id as string,
      token: row.token as string,
      domain: row.domain as string,
      score: row.score as number,
      verdict: (row.verdict as string) ?? undefined,
      fullName: (lead?.full_name as string) ?? undefined,
      businessName: (row.business_name as string) ?? undefined,
      email: (lead?.email as string) ?? undefined,
      phone: (lead?.phone as string) ?? undefined,
    });
    if (ok) sent += 1;
  }
  return sent;
}
