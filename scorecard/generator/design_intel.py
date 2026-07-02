#!/usr/bin/env python3
"""Operator-only design intel for Report B (Awwwards + WebsiteRating).

Best-effort: failures are stored in JSON and never block the customer report.
Runs on the VPS worker after each fresh scorecard generation.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from urllib.parse import quote

import requests

log = logging.getLogger("scorecard.intel")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT = int(os.environ.get("SCORECARD_INTEL_TIMEOUT_SEC", "25"))
PLAYWRIGHT_TIMEOUT_MS = int(os.environ.get("SCORECARD_INTEL_PLAYWRIGHT_MS", "120000"))
WEBSITERATING_UI_TIMEOUT_MS = int(os.environ.get("SCORECARD_INTEL_WR_UI_MS", "45000"))
CHROME_ARGS = ["--no-sandbox", "--disable-blink-features=AutomationControlled"]


def _site_url(domain: str) -> str:
    d = (domain or "").strip().lower()
    if d.startswith("http"):
        return d
    return f"https://{d}"


def _domain_needles(domain: str) -> list[str]:
    bare = domain.strip().lower().replace("www.", "")
    parts = [bare]
    if "." in bare:
        parts.append(bare.split(".")[0])
    return [p for p in parts if len(p) >= 4]


def _html_near_match(html: str, idx: int, needles: list[str], radius: int = 500) -> bool:
    chunk = html[max(0, idx - radius) : idx + radius].lower()
    return any(n in chunk for n in needles)


def _infer_trade(business_name: str, domain: str) -> str:
    hay = f"{business_name} {domain}".lower()
    rules = (
        (("plumb", "drain", "sewer", "pipe", "water heater"), "Plumbing"),
        (("hvac", "heating", "cooling", "air condition"), "HVAC"),
        (("electric",), "Electrician"),
        (("roof",), "Roofing"),
        (("landscap", "lawn", "mower"), "Landscaping"),
    )
    for keys, trade in rules:
        if any(k in hay for k in keys):
            return trade
    return "Plumbing"


INDUSTRY_SEARCH = {
    "plumbing": "plumbing",
    "electrician": "electrician",
    "roofing": "roofing",
    "landscaping": "landscaping",
    "hvac": "hvac",
    "cleaning": "cleaning",
}


def resolve_industry_search(
    industry: str | None,
    industry_other: str | None,
    business_name: str = "",
    domain: str = "",
) -> str:
    ind = (industry or "").strip()
    if ind and ind != "other" and ind in INDUSTRY_SEARCH:
        return INDUSTRY_SEARCH[ind]
    if ind == "other" and industry_other and industry_other.strip():
        return industry_other.strip().lower()
    return _infer_trade(business_name, domain).lower()


def fetch_awwwards(
    domain: str,
    business_name: str = "",
    industry_search: str | None = None,
) -> dict:
    """Check if the prospect domain is listed; trade search link for benchmarks."""
    domain = domain.strip().lower().replace("www.", "")
    trade = industry_search or _infer_trade(business_name, domain).lower()
    needles = _domain_needles(domain)
    domain_search_url = f"https://www.awwwards.com/websites/?text={quote(domain)}"
    search_url = f"https://www.awwwards.com/websites/?text={quote(trade)}"
    out: dict = {
        "ok": False,
        "listed": False,
        "trade": trade,
        "search_url": search_url,
        "profile_url": None,
        "title": None,
        "summary": None,
        "error": None,
    }
    try:
        r = requests.get(
            domain_search_url,
            headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"},
            timeout=REQUEST_TIMEOUT,
        )
        r.raise_for_status()
        html = r.text

        for m in re.finditer(
            r'href="(https://www\.awwwards\.com/sites/[^"]+|/sites/[^"]+)"',
            html,
            re.I,
        ):
            if not _html_near_match(html, m.start(), needles):
                continue
            href = m.group(1)
            profile = href if href.startswith("http") else f"https://www.awwwards.com{href}"
            out["profile_url"] = profile
            out["listed"] = True
            window = html[m.start() : m.start() + 800]
            title_m = re.search(
                r'class="[^"]*(?:title|name)[^"]*"[^>]*>([^<]+)<', window, re.I
            )
            if title_m:
                out["title"] = title_m.group(1).strip()
            break

        if out["listed"]:
            out["ok"] = True
            out["summary"] = (
                f"Listed on Awwwards"
                + (f" — {out['title']}" if out.get("title") else "")
                + (f" ({out['profile_url']})" if out.get("profile_url") else "")
            )
        else:
            out["ok"] = True
            out["summary"] = None
    except Exception as e:  # noqa: BLE001
        out["error"] = str(e)[:400]
        out["summary"] = f"Awwwards lookup failed — open {search_url} manually."
    return out


def _parse_websiterating_payload(data: dict) -> dict:
    """Normalize WebsiteRating /api/audit JSON (schema may vary)."""
    out: dict = {
        "ok": True,
        "source_url": "https://www.websiterating.com/",
        "audit_url": "https://www.websiterating.com/api/audit",
        "overall_score": None,
        "visitor_reaction": None,
        "top_fix": None,
        "categories": [],
        "raw": data,
        "error": None,
    }

    for key in ("overall_score", "overallScore", "score", "total_score"):
        if key in data and data[key] is not None:
            out["overall_score"] = data[key]
            break

    for key in ("visitor_reaction", "visitorReaction", "first_impression", "reaction"):
        if isinstance(data.get(key), str):
            out["visitor_reaction"] = data[key][:2000]
            break

    for key in ("top_fix", "topFix", "highest_impact_fix", "recommendation"):
        if isinstance(data.get(key), str):
            out["top_fix"] = data[key][:2000]
            break

    cats = data.get("categories") or data.get("breakdown") or data.get("scores")
    if isinstance(cats, dict):
        for name, val in cats.items():
            if isinstance(val, dict):
                out["categories"].append(
                    {
                        "name": str(name),
                        "score": val.get("score") or val.get("value"),
                        "note": val.get("note") or val.get("summary"),
                    }
                )
            else:
                out["categories"].append({"name": str(name), "score": val})
    elif isinstance(cats, list):
        for item in cats:
            if isinstance(item, dict):
                out["categories"].append(
                    {
                        "name": item.get("name") or item.get("category") or "Category",
                        "score": item.get("score") or item.get("value"),
                        "note": item.get("note") or item.get("summary"),
                    }
                )

    return out


def _friendly_websiterating_error(raw: str) -> str:
    """Operator-facing message — hide Playwright/HTTP noise."""
    low = raw.lower()
    if "just a moment" in low or "cloudflare" in low:
        return (
            "WebsiteRating blocked the automated check — open the link below "
            "and run a manual audit for this URL."
        )
    if "timeout" in low or "exceeded while waiting" in low:
        return (
            "Automated audit timed out on the server — open WebsiteRating "
            "below and paste the client URL for a manual run."
        )
    if low.startswith("http 403"):
        return (
            "WebsiteRating blocked the automated check — open the link below "
            "and run a manual audit for this URL."
        )
    return raw[:400]


def _wait_past_cloudflare(page, timeout_ms: int) -> bool:
    """Wait until WebsiteRating is past the CF interstitial."""
    deadline = time.time() + timeout_ms / 1000
    while time.time() < deadline:
        title = (page.title() or "").lower()
        if "just a moment" not in title and "attention required" not in title:
            try:
                page.wait_for_selector(
                    'input[type="url"], input[placeholder*="http"], input[placeholder*="URL"]',
                    timeout=3000,
                )
                return True
            except Exception:  # noqa: BLE001
                if "websiterating" in title or "website audit" in title:
                    return True
        page.wait_for_timeout(1000)
    return False


def _audit_via_api_request(page, site_url: str) -> tuple[int, str]:
    """POST /api/audit using Playwright request context (inherits CF cookies)."""
    resp = page.request.post(
        "https://www.websiterating.com/api/audit",
        data=json.dumps({"url": site_url}),
        headers={"Content-Type": "application/json"},
    )
    return resp.status, resp.text()


def _audit_via_ui(page, site_url: str) -> tuple[int, str]:
    """Fill the homepage form and capture the audit API response."""
    inp = page.locator(
        'input[type="url"], input[placeholder*="http"], input[placeholder*="URL"]'
    ).first
    inp.wait_for(state="visible", timeout=15000)
    inp.fill(site_url)
    with page.expect_response(
        lambda r: "/api/audit" in r.url and r.request.method == "POST",
        timeout=WEBSITERATING_UI_TIMEOUT_MS,
    ) as resp_info:
        page.get_by_role("button", name=re.compile(r"audit", re.I)).first.click()
    resp = resp_info.value
    try:
        text = resp.text()
    except Exception as e:  # noqa: BLE001
        return resp.status, str(e)
    return resp.status, text


def fetch_websiterating(domain: str) -> dict:
    """Call WebsiteRating audit API from a real browser context (Cloudflare)."""
    site_url = _site_url(domain)
    out: dict = {
        "ok": False,
        "source_url": "https://www.websiterating.com/",
        "audit_url": "https://www.websiterating.com/api/audit",
        "overall_score": None,
        "visitor_reaction": None,
        "top_fix": None,
        "categories": [],
        "error": None,
    }
    if os.environ.get("SCORECARD_INTEL_SKIP_WEBSITERATING", "").strip() in ("1", "true", "yes"):
        out["error"] = "skipped via SCORECARD_INTEL_SKIP_WEBSITERATING"
        return out

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=CHROME_ARGS)
            try:
                ctx = browser.new_context(
                    user_agent=UA,
                    viewport={"width": 1280, "height": 900},
                    locale="en-US",
                )
                page = ctx.new_page()
                page.set_default_timeout(PLAYWRIGHT_TIMEOUT_MS)
                page.goto(
                    "https://www.websiterating.com/",
                    wait_until="domcontentloaded",
                    timeout=PLAYWRIGHT_TIMEOUT_MS,
                )
                if not _wait_past_cloudflare(page, min(PLAYWRIGHT_TIMEOUT_MS, 60000)):
                    out["error"] = "Cloudflare challenge did not complete on WebsiteRating"
                    return out

                page.wait_for_timeout(1500)
                status, text = _audit_via_api_request(page, site_url)
                if status == 403 or (status != 200 and "just a moment" in text.lower()):
                    log.info("websiterating API blocked (%s) — trying UI audit flow", status)
                    status, text = _audit_via_ui(page, site_url)
            finally:
                browser.close()

        if status != 200:
            if "just a moment" in text.lower():
                out["error"] = _friendly_websiterating_error(text)
            else:
                out["error"] = _friendly_websiterating_error(
                    f"HTTP {status}: {text[:300]}"
                )
            return out

        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            out["error"] = f"Non-JSON response: {text[:300]}"
            return out

        parsed = _parse_websiterating_payload(
            payload if isinstance(payload, dict) else {"raw": payload}
        )
        parsed["ok"] = True
        return parsed
    except Exception as e:  # noqa: BLE001
        log.warning("websiterating intel failed: %s", e)
        out["error"] = _friendly_websiterating_error(str(e))
        return out


def gather_internal_intel(
    domain: str,
    business_name: str = "",
    industry_search: str | None = None,
) -> dict:
    return {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "awwwards": fetch_awwwards(domain, business_name, industry_search),
        "websiterating": fetch_websiterating(domain),
    }


def store_internal_intel(sb, report_id: str, intel: dict) -> None:
    sb.table("scorecard_reports").update({"internal_intel": intel}).eq("id", report_id).execute()
