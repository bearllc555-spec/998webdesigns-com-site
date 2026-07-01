import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_GENERATOR_URL = "https://generator.998webdesigns.com";

function generatorBaseUrl(): string {
  return (
    process.env.SCORECARD_GENERATOR_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_GENERATOR_URL
  );
}

/** Ask VPS Playwright to re-shoot a report's site thumbnail. */
export async function recaptureScorecardSiteShot(input: {
  reportId: string;
  domain: string;
}): Promise<{ ok: true; siteScreenshotUrl: string } | { ok: false; detail: string }> {
  const key = process.env.GENERATOR_API_KEY?.trim();
  if (!key) {
    return { ok: false, detail: "GENERATOR_API_KEY not configured on worker" };
  }

  const res = await fetch(`${generatorBaseUrl()}/capture-site`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-generator-key": key,
    },
    body: JSON.stringify({
      report_id: input.reportId,
      domain: input.domain,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      detail: `Generator HTTP ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  let data: { site_screenshot_url?: string };
  try {
    data = JSON.parse(text) as { site_screenshot_url?: string };
  } catch {
    return { ok: false, detail: "Generator returned invalid JSON" };
  }

  const url = data.site_screenshot_url?.trim();
  if (!url) {
    return { ok: false, detail: "Generator did not return site_screenshot_url" };
  }

  return { ok: true, siteScreenshotUrl: url };
}

export async function recaptureScorecardSiteByToken(
  token: string
): Promise<
  | { ok: true; siteScreenshotUrl: string; domain: string }
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

  const result = await recaptureScorecardSiteShot({
    reportId: report.id as string,
    domain: report.domain as string,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    siteScreenshotUrl: result.siteScreenshotUrl,
    domain: report.domain as string,
  };
}
