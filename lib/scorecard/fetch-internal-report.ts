import { supabaseAdmin } from "@/lib/supabase";
import type { ScorecardInternalIntel } from "@/lib/scorecard/internal-intel-types";
import type { ScorecardReport, ScorecardSignal } from "@/lib/scorecard/types";

export type InternalScorecardBundle = {
  report: ScorecardReport & {
    token: string;
    internal_intel: ScorecardInternalIntel | null;
    screenshot_url?: string | null;
    site_screenshot_url?: string | null;
    email_status?: string | null;
  };
  signals: ScorecardSignal[];
  lead: {
    email: string | null;
    phone: string | null;
    business_name: string | null;
    domain: string | null;
    source: string | null;
  } | null;
  jobPayload: Record<string, unknown> | null;
};

/** CRM-only fetch — never call from public routes. */
export async function fetchInternalScorecard(token: string): Promise<InternalScorecardBundle | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const { data: report, error } = await supa
    .from("scorecard_reports")
    .select(
      "id, token, lead_id, domain, business_name, score, verdict, competitor_name, competitor_score, tested_on, created_at, source_door, screenshot_url, site_screenshot_url, email_status, internal_intel"
    )
    .eq("token", token)
    .eq("status", "active")
    .maybeSingle();

  if (error || !report) return null;

  const { data: signals } = await supa
    .from("scorecard_signals")
    .select(
      "key, name, points, max_points, line, source, source_name, sort_order, locked"
    )
    .eq("report_id", report.id)
    .order("sort_order");

  let lead: InternalScorecardBundle["lead"] = null;
  if (report.lead_id) {
    const { data: leadRow } = await supa
      .from("leads")
      .select("email, phone, business_name, domain, source")
      .eq("id", report.lead_id)
      .maybeSingle();
    lead = leadRow ?? null;
  }

  const { data: jobRow } = await supa
    .from("scorecard_jobs")
    .select("payload")
    .eq("domain", report.domain)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    report: report as InternalScorecardBundle["report"],
    signals: (signals ?? []) as ScorecardSignal[],
    lead,
    jobPayload: (jobRow?.payload as Record<string, unknown>) ?? null,
  };
}

/** Unlock locked Door 2 rows for internal sales view with neutral placeholders. */
export function signalsForInternalBrief(signals: ScorecardSignal[]): ScorecardSignal[] {
  const placeholders: Record<string, { points: number; line: string }> = {
    conversion: {
      points: 6,
      line: "Internal placeholder — confirm tap-to-call, form above fold, and mobile CTA on your call.",
    },
    design: {
      points: 6,
      line: "Internal placeholder — confirm visual age vs. local competitors; see WebsiteRating + Awwwards below.",
    },
  };

  return signals.map((s) => {
    if (!s.locked) return s;
    const ph = placeholders[s.key];
    if (!ph) return s;
    return {
      ...s,
      locked: false,
      points: ph.points,
      line: ph.line,
      source: "manual" as const,
      source_name: "998 internal (sales brief)",
    };
  });
}
