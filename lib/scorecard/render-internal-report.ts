import { renderScorecardReportHtml, SCORECARD_REPORT_FAVICON_HEAD } from "@/lib/scorecard/render-report";
import type { ScorecardInternalIntel } from "@/lib/scorecard/internal-intel-types";
import type { ScorecardReport } from "@/lib/scorecard/types";
import {
  signalsForInternalBrief,
  type InternalScorecardBundle,
} from "@/lib/scorecard/fetch-internal-report";
import {
  awwwardsTradeSearchUrl,
  resolveScorecardIndustrySearch,
  scorecardIndustryLabel,
} from "@/lib/scorecard/industries";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" }[
      c
    ] as string)
  );

const INTEL_MISSING_HINT =
  "Sync <code>design_intel.py</code> on the VPS (<code>bash vps-sync-generator.sh</code>), then refresh — worker backfills on idle.";

function formatIntelError(err: string | null | undefined): string | null {
  if (!err) return null;
  const low = err.toLowerCase();
  if (low.includes("timeout") || low.includes("exceeded while waiting")) {
    return "Automated audit timed out on the server — use the link below to run it manually in your browser.";
  }
  if (low.includes("just a moment") || low.includes("cloudflare") || low.startsWith("http 403")) {
    return "WebsiteRating blocked the automated check — use the link below for a manual audit.";
  }
  return err;
}

/** Pre-filled WebsiteRating audit for the prospect domain. */
export function websiteratingManualAuditUrl(domain: string): string {
  const bare = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
  return `https://www.websiterating.com/audit/?d=${encodeURIComponent(bare)}`;
}

function intelSection(
  intel: ScorecardInternalIntel | null | undefined,
  domain: string,
  businessName: string,
  jobPayload: Record<string, unknown> | null
): string {
  const wrManualUrl = websiteratingManualAuditUrl(domain);
  const industrySearch = resolveScorecardIndustrySearch({
    industry: jobPayload?.industry as string | undefined,
    industryOther: jobPayload?.industry_other as string | undefined,
    businessName,
    domain,
  });
  const awSearchUrl = awwwardsTradeSearchUrl(industrySearch);

  if (!intel) {
    return `<section class="intel-wrap">
    <h2>Design intelligence (internal)</h2>
    <div class="intel-card"><h3>Awwwards</h3><p class="intel-muted">Not fetched yet.</p>
      <p class="intel-meta"><a href="${esc(awSearchUrl)}" target="_blank" rel="noopener">Search on Awwwards</a></p>
    </div>
    <div class="intel-card"><h3>WebsiteRating</h3><p class="intel-muted">Not fetched yet.</p>
      <p class="intel-meta"><a href="${esc(wrManualUrl)}" target="_blank" rel="noopener">Run manual audit</a></p>
    </div>
    <p class="intel-meta">${INTEL_MISSING_HINT}</p>
  </section>`;
  }

  const aw = intel.awwwards;
  const wr = intel.websiterating;
  const fetched = intel?.fetched_at
    ? new Date(intel.fetched_at).toLocaleString("en-US", { timeZone: "America/New_York" })
    : null;

  const awSummary =
    aw?.listed ? (aw.summary ?? aw.error ?? null) : (aw?.error ?? null);

  const awBlock = aw
    ? `<div class="intel-card">
        <h3>Awwwards <a href="https://www.awwwards.com/" target="_blank" rel="noopener">awwwards.com</a></h3>
        <p class="intel-meta">${aw.listed ? "Listed" : "Not listed"}${aw.profile_url ? ` · <a href="${esc(aw.profile_url)}" target="_blank" rel="noopener">profile</a>` : ""}</p>
        ${awSummary ? `<p>${esc(awSummary)}</p>` : ""}
        <p class="intel-meta"><a href="${esc(awSearchUrl)}" target="_blank" rel="noopener">Search on Awwwards</a></p>
        ${aw.error && !aw.ok ? `<p class="intel-err">${esc(aw.error)}</p>` : ""}
      </div>`
    : `<div class="intel-card"><h3>Awwwards</h3><p class="intel-muted">No data in snapshot.</p>
        <p class="intel-meta"><a href="${esc(awSearchUrl)}" target="_blank" rel="noopener">Search on Awwwards</a></p>
      </div>`;

  const wrCats =
    wr?.categories?.length ?
      `<ul class="intel-list">${wr.categories
          .map(
            (c) =>
              `<li><strong>${esc(c.name)}</strong>${c.score != null ? `: ${esc(c.score)}` : ""}${c.note ? ` — ${esc(c.note)}` : ""}</li>`
          )
          .join("")}</ul>`
    : "";

  const wrBlock = wr
    ? `<div class="intel-card">
        <h3>WebsiteRating <a href="${esc(wrManualUrl)}" target="_blank" rel="noopener">websiterating.com</a></h3>
        ${wr.overall_score != null ? `<p class="intel-score">Overall: <strong>${esc(wr.overall_score)}</strong></p>` : ""}
        ${wr.visitor_reaction ? `<p><span class="lbl">Visitor reaction</span> ${esc(wr.visitor_reaction)}</p>` : ""}
        ${wr.top_fix ? `<p><span class="lbl">Top fix</span> ${esc(wr.top_fix)}</p>` : ""}
        ${wrCats}
        ${wr.error && !wr.ok ? `<p class="intel-err">${esc(formatIntelError(wr.error))}</p>` : ""}
        <p class="intel-meta"><a href="${esc(wrManualUrl)}" target="_blank" rel="noopener">Run manual audit</a></p>
      </div>`
    : `<div class="intel-card"><h3>WebsiteRating</h3><p class="intel-muted">No data in snapshot.</p>
        <p class="intel-meta"><a href="${esc(wrManualUrl)}" target="_blank" rel="noopener">Run manual audit</a></p>
      </div>`;

  return `<section class="intel-wrap">
    <h2>Design intelligence (internal)</h2>
    ${fetched ? `<p class="intel-meta">Fetched ${esc(fetched)} ET</p>` : ""}
    ${awBlock}
    ${wrBlock}
  </section>`;
}

function contactBlock(bundle: InternalScorecardBundle): string {
  const email =
    bundle.lead?.email ??
    (typeof bundle.jobPayload?.email === "string" ? bundle.jobPayload.email : null);
  const phone =
    bundle.lead?.phone ??
    (typeof bundle.jobPayload?.phone === "string" ? bundle.jobPayload.phone : null);
  const name =
    (typeof bundle.jobPayload?.name === "string" ? bundle.jobPayload.name : null) ??
    bundle.report.business_name;

  const industryLabel = scorecardIndustryLabel(
    bundle.jobPayload?.industry as string | undefined,
    bundle.jobPayload?.industry_other as string | undefined
  );

  return `<div class="contact">
    <h2>Lead</h2>
    <p><span class="lbl">Name</span> ${esc(name)}</p>
    <p><span class="lbl">Email</span> ${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "—"}</p>
    <p><span class="lbl">Phone</span> ${phone ? `<a href="tel:${esc(phone)}">${esc(phone)}</a>` : "—"}</p>
    ${industryLabel ? `<p><span class="lbl">Industry</span> ${esc(industryLabel)}</p>` : ""}
    <p><span class="lbl">Source</span> ${esc(bundle.lead?.source ?? bundle.report.source_door ?? "—")}</p>
    <p><span class="lbl">Email status</span> ${esc(bundle.report.email_status ?? "—")}</p>
  </div>`;
}

function shotsBlock(report: InternalScorecardBundle["report"]): string {
  const parts: string[] = [];
  if (report.site_screenshot_url) {
    parts.push(
      `<figure><figcaption>Prospect site</figcaption><img src="${esc(report.site_screenshot_url)}" alt="Site screenshot" /></figure>`
    );
  }
  if (report.screenshot_url) {
    parts.push(
      `<figure><figcaption>Report A (customer view)</figcaption><img src="${esc(report.screenshot_url)}" alt="Report screenshot" /></figure>`
    );
  }
  if (!parts.length) return "";
  return `<div class="shots">${parts.join("")}</div>`;
}

/** Report B — operator sales brief (CRM auth required). */
export function renderInternalScorecardBriefHtml(
  bundle: InternalScorecardBundle,
  bookingUrl: string,
  publicBaseUrl: string
): string {
  const token = bundle.report.token;
  const publicUrl = `${publicBaseUrl.replace(/\/$/, "")}/r/${token}`;
  const customerReport = renderScorecardReportHtml(
    bundle.report as ScorecardReport,
    bundle.signals,
    bookingUrl
  );

  const unlocked = signalsForInternalBrief(bundle.signals);
  const internalScorecard = renderScorecardReportHtml(
    {
      ...bundle.report,
      business_name: `${bundle.report.business_name} (internal — unlocked signals)`,
    } as ScorecardReport,
    unlocked,
    bookingUrl
  );

  const bodyMatch = internalScorecard.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const innerReport = bodyMatch ? bodyMatch[1] : internalScorecard;

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${SCORECARD_REPORT_FAVICON_HEAD}
<title>Internal brief — ${esc(bundle.report.business_name)}</title>
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
background:#0f1419;color:#e8e6e0;line-height:1.55}
.top{position:sticky;top:0;z-index:10;background:#1a2332;border-bottom:1px solid #2a3544;
padding:12px 20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.top h1{font-size:15px;font-weight:600;margin:0;color:#fff}
.top a{color:#7eb8ff;font-size:13px;margin-right:14px}
.shell{max-width:720px;margin:0 auto;padding:20px 16px 64px}
.banner{background:#3d2a00;border:1px solid #6b4f00;color:#ffd88a;border-radius:10px;
padding:12px 16px;font-size:13px;margin-bottom:20px}
.contact,.intel-wrap,.panel{margin-bottom:24px;padding:18px 20px;border-radius:12px;
background:#1a2332;border:1px solid #2a3544}
.contact h2,.intel-wrap h2,.panel h2{font-size:14px;margin:0 0 12px;color:#fff;text-transform:uppercase;letter-spacing:.04em}
.lbl{color:#9aa3ad;font-size:12px;margin-right:6px}
.intel-card{margin-top:14px;padding-top:14px;border-top:1px solid #2a3544}
.intel-card h3{font-size:15px;margin:0 0 8px;color:#fff}
.intel-card a{color:#7eb8ff}
.intel-meta{font-size:12px;color:#9aa3ad}
.intel-muted{color:#9aa3ad;font-size:13px}
.intel-err{color:#f5a5a5;font-size:12px}
.intel-score{font-size:16px}
.intel-list{margin:8px 0 0;padding-left:18px;font-size:13px}
.shots{display:grid;gap:16px;margin:20px 0}
.shots img{max-width:100%;border-radius:8px;border:1px solid #2a3544}
.shots figcaption{font-size:12px;color:#9aa3ad;margin-bottom:6px}
.customer-panel{background:#fff;color:#1a1a1a;border-radius:12px;overflow:hidden;margin-top:8px}
.customer-panel summary{cursor:pointer;padding:14px 18px;font-weight:600;background:#f7f6f2}
.customer-panel .customer-body{border-top:1px solid #e5e5e0}
</style></head><body>
<div class="top">
  <h1>Report B · Internal sales brief</h1>
  <div>
    <a href="${esc(publicUrl)}" target="_blank" rel="noopener">Customer report (A) ↗</a>
    <a href="/crm">← CRM</a>
  </div>
</div>
<div class="shell">
  <div class="banner">Internal only — includes unlocked conversion/design placeholders plus Awwwards &amp; WebsiteRating intel. Do not share this URL with prospects.</div>
  ${contactBlock(bundle)}
  ${intelSection(
    bundle.report.internal_intel,
    bundle.report.domain,
    bundle.report.business_name,
    bundle.jobPayload
  )}
  ${shotsBlock(bundle.report)}
  <div class="panel">
    <h2>Scorecard with unlocked signals</h2>
    <div class="report-inner">${innerReport}</div>
  </div>
  <details class="customer-panel panel">
    <summary>Preview: exact customer report (A)</summary>
    <div class="customer-body">${customerReport.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? ""}</div>
  </details>
</div>
</body></html>`;
}

export const SCORECARD_BRIEF_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "x-robots-tag": "noindex, nofollow",
  "cache-control": "private, no-store",
} as const;
