import type { ScorecardReport, ScorecardSignal } from "@/lib/scorecard/types";
import { scorecardRerunMessage } from "@/lib/scorecard/dedup";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" }[
      c
    ] as string)
  );

const VERDICT_TEXT: Record<string, string> = {
  danger: "This site is actively costing you jobs every week. Here's exactly where.",
  warning: "Your site is functional but leaking calls. Here's exactly where.",
  good: "Your site is in good shape — a few tune-ups and you're set.",
};

const VERDICT_INK: Record<string, string> = {
  danger: "#791f1f",
  warning: "#854f0b",
  good: "#0f6e56",
};

function band(points: number, max: number): "ok" | "warn" | "danger" {
  const r = max ? points / max : 0;
  if (r >= 0.8) return "ok";
  if (r >= 0.4) return "warn";
  return "danger";
}

function signalHtml(s: ScorecardSignal): string {
  if (s.locked) {
    return `
    <div class="sig sig-locked">
      <div class="sig-top">
        <span class="sig-name">${esc(s.name)}</span>
        <span class="sig-score lock">🔒 Not yet assessed</span>
      </div>
      <div class="bar bar-locked"><span style="width:0%"></span></div>
      <p class="sig-line">${esc(s.line)}</p>
      <span class="tag manual">${esc(s.source_name)}</span>
    </div>`;
  }
  const b = band(s.points ?? 0, s.max_points);
  const pct = Math.round(((s.points ?? 0) / s.max_points) * 100);
  return `
    <div class="sig">
      <div class="sig-top">
        <span class="sig-name">${esc(s.name)}</span>
        <span class="sig-score c-${b}">${s.points} / ${s.max_points}</span>
      </div>
      <div class="bar f-${b}"><span style="width:${pct}%"></span></div>
      <p class="sig-line">${esc(s.line)}</p>
      <span class="tag ${s.source === "tool" ? "tool" : "manual"}">${esc(s.source_name)}</span>
    </div>`;
}

export function renderScorecardReportHtml(
  report: ScorecardReport,
  signals: ScorecardSignal[],
  bookingUrl: string
): string {
  const v = report.verdict;
  const verdictLine = VERDICT_TEXT[v] ?? VERDICT_TEXT.warning;
  const ink = VERDICT_INK[v] ?? VERDICT_INK.warning;
  const tested = new Date(`${report.tested_on}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const rerunLine = scorecardRerunMessage(report);

  const cmp =
    report.competitor_name && report.competitor_score != null
      ? `
    <div class="cmp">
      <div class="col"><p class="lbl">You</p><p class="v c-danger">${report.score}</p></div>
      <div class="vs">vs</div>
      <div class="col"><p class="lbl">${esc(report.competitor_name)}</p>
        <p class="v c-ok">${report.competitor_score}</p></div>
    </div>
    <p class="cmp-note">Both sites run through the identical test on the same day.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Website report — ${esc(report.business_name)}</title>
<style>
:root{--ink:#1a1a1a;--muted:#6b6b66;--hint:#9a9a93;--line:rgba(0,0,0,.12);
--danger:#a32d2d;--danger-bg:#fcebeb;--warn:#854f0b;--warn-bg:#faeeda;
--ok:#0f6e56;--ok-bg:#e1f5ee;--info:#0c447c;--info-bg:#e6f1fb;--surface:#f7f6f2}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:680px;margin:0 auto;padding:28px 20px 56px}
.head{display:flex;align-items:center;justify-content:space-between;gap:16px;
padding-bottom:20px;border-bottom:.5px solid var(--line)}
.kicker{font-size:13px;color:var(--muted);margin:0 0 4px}
.biz{font-size:20px;font-weight:500;margin:0}
.sub{font-size:13px;color:var(--hint);margin:4px 0 0}
.dial{flex-shrink:0;width:96px;height:96px;border-radius:50%;
display:flex;flex-direction:column;align-items:center;justify-content:center}
.dial .n{font-size:34px;font-weight:500;line-height:1}
.dial .o{font-size:11px;margin-top:2px}
.banner{border-radius:12px;padding:12px 16px;margin:20px 0;font-size:14px}
.cmp{display:flex;align-items:center;gap:16px;background:var(--surface);
border-radius:12px;padding:16px 20px;margin-bottom:6px}
.cmp .col{flex:1;text-align:center}
.cmp .lbl{font-size:12px;color:var(--muted);margin:0 0 6px}
.cmp .v{font-size:28px;font-weight:500;margin:0}
.cmp .vs{font-size:13px;color:var(--hint)}
.cmp-note{font-size:12px;color:var(--hint);margin:0 0 28px;text-align:center}
.sig{padding:16px 0;border-bottom:.5px solid var(--line)}
.sig-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.sig-name{font-size:15px;font-weight:500}
.sig-score{font-size:13px;font-weight:500;white-space:nowrap}
.sig-score.lock{color:var(--muted)}
.bar{height:7px;background:var(--line);border-radius:4px;overflow:hidden;margin-bottom:8px}
.bar > span{display:block;height:100%;border-radius:4px}
.bar-locked{background:repeating-linear-gradient(45deg,#eee,#eee 6px,#f6f6f2 6px,#f6f6f2 12px)}
.sig-line{font-size:13px;color:var(--muted);margin:0 0 8px}
.tag{font-size:11px;padding:2px 8px;border-radius:8px;white-space:nowrap}
.tag.tool{color:var(--info);background:var(--info-bg)}
.tag.manual{color:var(--muted);background:var(--surface)}
.sources{margin-top:28px;padding:16px 20px;background:var(--surface);border-radius:12px}
.sources h3{font-size:13px;font-weight:500;margin:0 0 10px}
.src{font-size:13px;padding:4px 0}
.src a{color:var(--info)}
.fine{font-size:12px;color:var(--hint);margin:12px 0 0}
.fine.rerun{margin-top:8px;color:var(--muted)}
.cta{margin-top:24px;padding:20px;background:var(--info-bg);border-radius:12px}
.cta h3{font-size:15px;font-weight:500;margin:0 0 6px;color:var(--info)}
.cta p{font-size:14px;margin:0 0 14px;color:var(--info)}
.cta a{display:inline-block;font-size:14px;font-weight:500;text-decoration:none;
color:#fff;background:var(--info);padding:10px 18px;border-radius:8px}
.c-danger{color:var(--danger)}.bg-danger{background:var(--danger-bg)}.f-danger > span{background:var(--danger)}
.c-warn{color:var(--warn)}.bg-warn{background:var(--warn-bg)}.f-warn > span{background:var(--warn)}
.c-ok{color:var(--ok)}.bg-ok{background:var(--ok-bg)}.f-ok > span{background:var(--ok)}
</style></head><body>
<div class="wrap">
  <div class="head">
    <div>
      <p class="kicker">Website performance report</p>
      <p class="biz">${esc(report.business_name)}</p>
      <p class="sub">${esc(report.domain)} &middot; prepared by 998 Web Designs &middot; tested ${esc(tested)}</p>
    </div>
    <div class="dial bg-${v}"><span class="n c-${v}">${report.score}</span><span class="o c-${v}">out of 100</span></div>
  </div>
  <div class="banner bg-${v}" style="color:${ink}">${esc(verdictLine)} Every measured number below lists its source.</div>
  ${cmp}
  ${signals.map(signalHtml).join("\n")}
  <div class="sources">
    <h3>How we measured this</h3>
    <div class="src"><a href="https://pagespeed.web.dev">Google PageSpeed Insights</a> &mdash; mobile speed &amp; load time</div>
    <div class="src"><a href="https://www.ssllabs.com/ssltest">SSL Labs (Qualys)</a> &mdash; HTTPS certificate &amp; security</div>
    <div class="src"><a href="https://www.google.com/maps">Google Business Profile</a> &mdash; review count, rating, recency</div>
    <div class="src"><a href="https://www.screamingfrog.co.uk/seo-spider">Screaming Frog / homepage crawl</a> &mdash; title, meta, headings, schema</div>
    <p class="fine">All tools above are free and public &mdash; you can run any of them on your own site, and we encourage it. Items tagged &ldquo;manual review&rdquo; are our own assessment, noted honestly as judgment rather than a tool score. Locked items are not yet assessed &mdash; we review those by hand on a call.</p>
    ${rerunLine ? `<p class="fine rerun">${esc(rerunLine)}</p>` : ""}
  </div>
  <div class="cta">
    <h3>We can fix all of this.</h3>
    <p>A modern, fast, mobile-first site with click-to-call, your reviews front and center, and the local SEO Google needs to rank you. Flat design fee, free hosting to start, and a love-it-or-don't-pay-the-balance guarantee.</p>
    <a href="${esc(bookingUrl)}">Book a 15-minute call &rarr;</a>
  </div>
</div>
</body></html>`;
}

export function scorecardNotFoundHtml(): string {
  return `<!doctype html><meta name="robots" content="noindex,nofollow">
<title>Report not found</title>
<body style="font-family:-apple-system,Arial;max-width:520px;margin:80px auto;
padding:0 20px;color:#1a1a1a">
<h1 style="font-weight:500">Report not found</h1>
<p style="color:#6b6b66">This report link isn't valid. If you think this is a
mistake, reply to the email you received.</p></body>`;
}

export const SCORECARD_REPORT_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "x-robots-tag": "noindex, nofollow",
  "cache-control": "private, no-store",
} as const;
