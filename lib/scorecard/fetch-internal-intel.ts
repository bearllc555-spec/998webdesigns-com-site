import { supabaseAdmin } from "@/lib/supabase";
import type { ScorecardInternalIntel } from "@/lib/scorecard/internal-intel-types";

const DEFAULT_GENERATOR_URL = "https://generator.998webdesigns.com";

export function scorecardGeneratorBaseUrl(): string {
  return (
    process.env.SCORECARD_GENERATOR_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_GENERATOR_URL
  );
}

function generatorKey(): string | null {
  return process.env.GENERATOR_API_KEY?.trim() || null;
}

async function postGenerator<T>(
  path: string,
  body: Record<string, string>
): Promise<{ ok: true; data: T } | { ok: false; detail: string }> {
  const key = generatorKey();
  if (!key) {
    return { ok: false, detail: "GENERATOR_API_KEY not configured on worker" };
  }

  const res = await fetch(`${scorecardGeneratorBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-generator-key": key,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      detail: `Generator HTTP ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, detail: "Generator returned invalid JSON" };
  }
}

/** Ask VPS to fetch Awwwards + WebsiteRating intel for one report. */
export async function fetchScorecardInternalIntel(input: {
  reportId: string;
  domain: string;
}): Promise<
  | { ok: true; internalIntel: ScorecardInternalIntel | null }
  | { ok: false; detail: string }
> {
  const result = await postGenerator<{ internal_intel?: ScorecardInternalIntel | null }>(
    "/fetch-intel",
    { report_id: input.reportId, domain: input.domain }
  );
  if (!result.ok) return result;

  return {
    ok: true,
    internalIntel: result.data.internal_intel ?? null,
  };
}

export async function fetchScorecardInternalIntelByToken(
  token: string
): Promise<
  | { ok: true; internalIntel: ScorecardInternalIntel | null; domain: string }
  | { ok: false; detail: string }
> {
  const supa = supabaseAdmin();
  if (!supa) {
    return { ok: false, detail: "Supabase admin unavailable" };
  }

  const { data: report, error } = await supa
    .from("scorecard_reports")
    .select("id, domain")
    .eq("token", token)
    .eq("status", "active")
    .maybeSingle();

  if (error || !report?.id) {
    return { ok: false, detail: "Report not found" };
  }

  const result = await fetchScorecardInternalIntel({
    reportId: report.id as string,
    domain: report.domain as string,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    internalIntel: result.internalIntel,
    domain: report.domain as string,
  };
}
