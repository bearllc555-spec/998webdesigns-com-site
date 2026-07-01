#!/usr/bin/env python3
"""
Generator service (runs on the VPS).
=====================================
Two entry modes over the SAME generation core:
  - POST /generate   (synchronous)  -> Door 1, outbound script (returns URL only)
  - queue worker loop (background)  -> Door 2, public form (generates + emails)

Run two processes (systemd units recommended; see docs/DEPLOY_NOTES.md):
  1) uvicorn service:app --host 0.0.0.0 --port 8080      # the HTTP endpoint
  2) python3 service.py --worker                          # the queue worker

Both modes call the identical generate_for_lead core. The only behavioural
difference is who waits and who sends the email:
  * Door 1: /generate scores+stores+screenshots and RETURNS THE URL. It does
    NOT send the email (Anthony's send-script embeds the URL). Confirmed default.
  * Door 2: the worker scores+stores+screenshots AND sends the report email.

ENV (VPS, server-side only):
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  PAGESPEED_API_KEY, PLACES_API_KEY
  PUBLIC_BASE_URL, BOOKING_URL
  GENERATOR_API_KEY            # shared secret both doors present (x-generator-key)
  SUPABASE_STORAGE_BUCKET      # default 'scorecard-shots'
  RESEND_API_KEY               # transactional email
  EMAIL_FROM                   # report sender on a domain SEPARATE from cold campaign
  EMAIL_REPLY_TO               # optional
  COMPANY_ADDRESS              # CAN-SPAM physical address (footer)
  UNSUBSCRIBE_URL              # CAN-SPAM unsubscribe (footer)
  SCREENSHOT_TIMEOUT_MS        # default 20000
"""

import argparse
import asyncio
import logging
import os
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor

import scorer_core as core
from supabase_generator import (
    generate_for_lead, find_recent_report, set_screenshots, set_email_status,
    _client,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("scorecard")

PROTECTED_DOMAIN_ROOTS = ("998webdesigns.com",)


class ProtectedDomainError(Exception):
    """Public scorecard must not scan operator-owned domains."""


def _is_protected_domain(domain: str) -> bool:
    d = (domain or "").strip().lower()
    if not d:
        return False
    for root in PROTECTED_DOMAIN_ROOTS:
        if d == root or d.endswith(f".{root}"):
            return True
    return False


def _internal_email_allowlist() -> set[str]:
    emails = {"bearllc555@gmail.com", "demeos@gmail.com"}
    raw = os.environ.get("SCORECARD_INTERNAL_EMAILS", "")
    for part in raw.replace(";", ",").split(","):
        e = part.strip().lower()
        if e:
            emails.add(e)
    return emails


def _is_internal_email(email: str) -> bool:
    e = (email or "").strip().lower()
    if not e:
        return False
    if e.endswith("@998webdesigns.com"):
        return True
    return e in _internal_email_allowlist()


def _internal_unlimited_scan(email: str, domain: str) -> bool:
    return _is_protected_domain(domain) and _is_internal_email(email)

STORAGE_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "scorecard-shots")
SCREENSHOT_TIMEOUT_MS = int(os.environ.get("SCREENSHOT_TIMEOUT_MS", "20000"))
# Playwright sync API must not run on the FastAPI asyncio loop.
_screenshot_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="screenshot")


async def capture_screenshot_async(target_url: str, label: str) -> str | None:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        _screenshot_executor, capture_screenshot, target_url, label
    )


# =========================================================================== #
# Screenshot — Playwright (headless Chromium) -> Supabase Storage
# =========================================================================== #
def capture_screenshot(target_url: str, label: str) -> str | None:
    """Render target_url in headless Chromium, upload the PNG to Supabase
    Storage, return its public URL. Caps the wait; returns None on failure so
    the email still sends with the text fallback.

    Called TWICE per report (same machinery, two targets):
      - the analysis report page  -> stored as screenshot_url
      - the client's OWN website   -> stored as site_screenshot_url
    The client-site capture may be slow/flaky; a missing site shot must not
    block the email.
    """
    png_bytes = None
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--no-sandbox"])
            try:
                page = browser.new_page(
                    viewport={"width": 700, "height": 1000},
                    device_scale_factor=2,
                )
                page.set_default_timeout(SCREENSHOT_TIMEOUT_MS)
                page.goto(target_url, wait_until="networkidle",
                          timeout=SCREENSHOT_TIMEOUT_MS)
                png_bytes = page.screenshot(full_page=True, type="png")
            finally:
                browser.close()
    except Exception as e:  # noqa: BLE001
        log.warning("screenshot capture failed (%s): %s", label, e)
        return None

    if not png_bytes:
        return None

    try:
        sb = _client()
        key = f"{label}/{uuid.uuid4().hex}.png"
        # supabase-py storage upload; upsert in case of retry
        sb.storage.from_(STORAGE_BUCKET).upload(
            path=key,
            file=png_bytes,
            file_options={"content-type": "image/png", "upsert": "true"},
        )
        public = sb.storage.from_(STORAGE_BUCKET).get_public_url(key)
        return public
    except Exception as e:  # noqa: BLE001
        log.warning("screenshot upload failed (%s): %s", label, e)
        return None


# =========================================================================== #
# Email — transactional provider (Resend). Teaser: 2 images + TEXT FALLBACK.
# =========================================================================== #
def _email_html(report_url, site_shot_url, analysis_shot_url, score,
                verdict_line, business_name):
    booking = os.environ.get("BOOKING_URL", report_url)
    company_addr = os.environ.get("COMPANY_ADDRESS", "998 Web Designs")
    unsub = os.environ.get("UNSUBSCRIBE_URL", "#")
    imgs = ""
    if site_shot_url:
        imgs += (f'<p style="margin:0 0 8px;font:13px/1.4 -apple-system,Arial;'
                 f'color:#555">Your site today:</p>'
                 f'<a href="{report_url}"><img src="{site_shot_url}" '
                 f'alt="Your website" width="320" '
                 f'style="max-width:100%;border:1px solid #e2e2e2;border-radius:8px;'
                 f'display:block;margin:0 0 18px"></a>')
    if analysis_shot_url:
        imgs += (f'<p style="margin:0 0 8px;font:13px/1.4 -apple-system,Arial;'
                 f'color:#555">Your scorecard:</p>'
                 f'<a href="{report_url}"><img src="{analysis_shot_url}" '
                 f'alt="Your website scorecard" width="320" '
                 f'style="max-width:100%;border:1px solid #e2e2e2;border-radius:8px;'
                 f'display:block;margin:0 0 18px"></a>')
    # The TEXT FALLBACK below renders even when every image is blocked.
    return f"""\
<!doctype html><html><body style="margin:0;background:#f6f6f6;padding:24px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;
     padding:28px;font:15px/1.5 -apple-system,Segoe UI,Arial;color:#1a1a1a">
  <p style="font:600 13px/1 -apple-system,Arial;color:#888;letter-spacing:.04em;
     text-transform:uppercase;margin:0 0 6px">Website Scorecard</p>
  <h1 style="font:700 22px/1.2 -apple-system,Arial;margin:0 0 16px">
     {business_name}</h1>
  {imgs}
  <!-- TEXT FALLBACK: number + verdict + link, always visible -->
  <div style="border-top:1px solid #eee;padding-top:18px;margin-top:4px">
    <p style="margin:0 0 6px;font:700 17px/1.3 -apple-system,Arial">
       Your score: {score} / 100</p>
    <p style="margin:0 0 18px;color:#444">{verdict_line}</p>
    <a href="{report_url}"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;
       padding:13px 22px;border-radius:8px;font:600 15px/1 -apple-system,Arial">
       View your full report &rarr;</a>
    <p style="margin:16px 0 0;font:13px/1.5 -apple-system,Arial;color:#888">
       Or book a 15-minute call: <a href="{booking}">{booking}</a></p>
  </div>
  <p style="margin:24px 0 0;font:11px/1.5 -apple-system,Arial;color:#aaa;
     border-top:1px solid #f0f0f0;padding-top:12px">
     {company_addr}<br>
     You're receiving this because you requested a website scorecard.
     <a href="{unsub}" style="color:#aaa">Unsubscribe</a>.</p>
</div></body></html>"""


def _email_text(report_url, score, verdict_line, business_name):
    booking = os.environ.get("BOOKING_URL", report_url)
    unsub = os.environ.get("UNSUBSCRIBE_URL", "")
    addr = os.environ.get("COMPANY_ADDRESS", "998 Web Designs")
    return (f"Website Scorecard — {business_name}\n\n"
            f"Your score: {score}/100\n{verdict_line}\n\n"
            f"View your full report: {report_url}\n"
            f"Book a 15-minute call: {booking}\n\n"
            f"{addr}\n"
            f"You requested this scorecard. Unsubscribe: {unsub}\n")


def send_report_email(to_email: str, report_url: str,
                      site_shot_url: str | None, analysis_shot_url: str | None,
                      score: int, verdict_line: str,
                      business_name: str = "Your website") -> dict:
    """Send via Resend on the SEPARATE report sender domain. Returns
    {status, bounced}. Never image-only: HTML carries a text fallback and a
    plain-text part is always attached."""
    api_key = os.environ.get("RESEND_API_KEY")
    email_from = os.environ.get("EMAIL_FROM")
    if not api_key or not email_from:
        raise RuntimeError("RESEND_API_KEY / EMAIL_FROM not configured")
    try:
        import resend
        resend.api_key = api_key
        params = {
            "from": email_from,
            "to": [to_email],
            "subject": f"Your website scorecard: {score}/100",
            "html": _email_html(report_url, site_shot_url, analysis_shot_url,
                                score, verdict_line, business_name),
            "text": _email_text(report_url, score, verdict_line, business_name),
        }
        reply_to = os.environ.get("EMAIL_REPLY_TO")
        if reply_to:
            params["reply_to"] = [reply_to]
        resp = resend.Emails.send(params)
        log.info("email sent to %s (id=%s)", to_email, resp.get("id"))
        return {"status": "sent", "bounced": False, "id": resp.get("id")}
    except Exception as e:  # noqa: BLE001
        log.error("email send failed to %s: %s", to_email, e)
        # Hard-bounce-ish provider errors are surfaced; transient ones retry via
        # the worker's attempt counter.
        return {"status": "failed", "bounced": False, "error": str(e)[:300]}


def _auth_ok(headers) -> bool:
    expected = os.environ.get("GENERATOR_API_KEY")
    got = headers.get("x-generator-key")
    # constant-time-ish compare
    return bool(expected) and bool(got) and \
        len(expected) == len(got) and \
        sum(a != b for a, b in zip(expected, got)) == 0


# --------------------------------------------------------------------------- #
# Synchronous HTTP endpoint (Door 1) — returns the URL only.
# --------------------------------------------------------------------------- #
try:
    from fastapi import FastAPI, Request, HTTPException
    app = FastAPI(title="Scorecard Generator")

    @app.get("/health")
    async def health():
        return {"ok": True}

    @app.post("/generate")
    async def generate(req: Request):
        if not _auth_ok(req.headers):
            raise HTTPException(401, "bad key")
        body = await req.json()
        for required in ("lead_id", "domain", "business_name"):
            if not body.get(required):
                raise HTTPException(422, f"missing {required}")
        out = generate_for_lead(
            body["lead_id"], body["domain"], body["business_name"],
            body.get("competitor_name"), body.get("competitor_domain"),
            source_door="outbound",
        )
        # Door 1 captures screenshots now (so the email Anthony's script sends
        # can embed them), but does NOT send the email itself.
        sb = _client()
        try:
            analysis = await capture_screenshot_async(out["url"], "analysis")
            site = await capture_screenshot_async(
                f"https://{out['domain']}", "site"
            )
            set_screenshots(sb, out["report_id"], analysis, site)
            out["screenshot_url"] = analysis
            out["site_screenshot_url"] = site
        except Exception as e:  # noqa: BLE001
            log.warning("door1 screenshot step degraded: %s", e)
        return {"report_url": out["url"], **out}
except ImportError:
    app = None  # FastAPI not installed in an analysis env; fine.


# --------------------------------------------------------------------------- #
# Queue worker (Door 2) — generates AND emails.
# --------------------------------------------------------------------------- #
def claim_one_queued_job(sb):
    """Atomically claim one queued job via the claim_scorecard_job RPC."""
    res = sb.rpc("claim_scorecard_job").execute()
    job = res.data
    if not job or not job.get("id"):
        return None
    return job


def _resolve_job_email(sb, job, payload: dict) -> str:
    """Email from job payload, else from leads row."""
    email = (payload.get("email") or "").strip().lower()
    if email:
        return email
    lead_id = job.get("lead_id")
    if not lead_id:
        return ""
    row = (
        sb.table("leads")
        .select("email")
        .eq("id", lead_id)
        .limit(1)
        .execute()
    ).data
    return (row[0].get("email") or "").strip().lower() if row else ""


def _process_job(sb, job):
    p = job["payload"] or {}
    domain = job["domain"]
    email = _resolve_job_email(sb, job, p)
    if _is_protected_domain(domain) and not _is_internal_email(email):
        raise ProtectedDomainError(domain)
    if not email:
        raise ValueError("job missing email (payload and leads row)")
    business = p.get("business_name") or p.get("company") or core.guess_name(domain)
    internal_unlimited = _internal_unlimited_scan(email, domain)

    # Dedup: reuse an active report for this domain generated within DEDUP_DAYS,
    # instead of re-running PageSpeed + a browser. Re-send the email to the new
    # requester. Internal operator scans of our own site skip dedup (unlimited).
    existing = find_recent_report(sb, domain)
    if existing and not internal_unlimited:
        base = os.environ["PUBLIC_BASE_URL"].rstrip("/")
        url = f"{base}/r/{existing['token']}"
        # fetch stored shots for the embed
        row = (sb.table("scorecard_reports")
                 .select("screenshot_url, site_screenshot_url")
                 .eq("id", existing["id"]).single().execute()).data or {}
        _verdict_line = core.verdict_for(existing["score"])[1]
        res = send_report_email(email, url, row.get("site_screenshot_url"),
                                row.get("screenshot_url"), existing["score"],
                                _verdict_line, business)
        set_email_status(sb, existing["id"], res["status"], res.get("bounced", False))
        log.info("job %s deduped to report %s", job["id"], existing["id"])
        return

    # Fresh generation (Door 2 shape: automated reviews + locked conv/design).
    out = generate_for_lead(
        job["lead_id"], domain, business,
        p.get("competitor_name"), p.get("competitor_domain"),
        source_door="form", competitor_count=p.get("competitor_count"),
    )
    analysis = site = None
    try:
        analysis = capture_screenshot(out["url"], "analysis")
    except Exception as e:  # noqa: BLE001
        log.warning("analysis screenshot failed (continuing): %s", e)
    try:
        site = capture_screenshot(f"https://{domain}", "site")
    except Exception as e:  # noqa: BLE001
        log.warning("site screenshot failed (continuing): %s", e)
    set_screenshots(sb, out["report_id"], analysis, site)

    res = send_report_email(email, out["url"], site, analysis,
                            out["score"], out["verdict_line"], business)
    set_email_status(sb, out["report_id"], res["status"], res.get("bounced", False))


def run_worker():
    sb = _client()
    log.info("worker: polling scorecard_jobs...")
    while True:
        job = claim_one_queued_job(sb)
        if not job:
            time.sleep(2)
            continue
        job_id = job["id"]
        try:
            _process_job(sb, job)
            sb.table("scorecard_jobs").update(
                {"status": "done"}).eq("id", job_id).execute()
            log.info("job %s done", job_id)
        except ProtectedDomainError as e:
            sb.table("scorecard_jobs").update({
                "status": "failed",
                "attempts": 3,
                "error": f"protected domain: {e}",
            }).eq("id", job_id).execute()
            log.info("job %s rejected: protected domain %s", job_id, e)
        except Exception as e:  # noqa: BLE001
            attempts = (job.get("attempts", 0) or 0) + 1
            sb.table("scorecard_jobs").update({
                "status": "failed" if attempts >= 3 else "queued",
                "attempts": attempts, "error": str(e)[:300],
            }).eq("id", job_id).execute()
            log.error("job %s error (attempt %s): %s", job_id, attempts, e)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--worker", action="store_true", help="run the queue worker")
    args = ap.parse_args()
    if args.worker:
        run_worker()
    else:
        print("Run the HTTP endpoint with: uvicorn service:app --port 8080\n"
              "Run the worker with:        python3 service.py --worker",
              file=sys.stderr)
