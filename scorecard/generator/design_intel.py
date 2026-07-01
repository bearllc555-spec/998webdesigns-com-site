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
from datetime import datetime, timezone
from urllib.parse import quote

import requests

log = logging.getLogger("scorecard.intel")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT = int(os.environ.get("SCORECARD_INTEL_TIMEOUT_SEC", "25"))
PLAYWRIGHT_TIMEOUT_MS = int(os.environ.get("SCORECARD_INTEL_PLAYWRIGHT_MS", "90000"))


def _site_url(domain: str) -> str:
    d = (domain or "").strip().lower()
    if d.startswith("http"):
        return d
    return f"https://{d}"


def fetch_awwwards(domain: str) -> dict:
    """Search Awwwards for the domain. Most local-trade sites are not listed."""
    domain = domain.strip().lower().replace("www.", "")
    search_url = f"https://www.awwwards.com/websites/search/?text={quote(domain)}"
    out: dict = {
        "ok": False,
        "listed": False,
        "search_url": search_url,
        "profile_url": None,
        "title": None,
        "summary": f"Not found on Awwwards — search: {search_url}",
        "error": None,
    }
    try:
        r = requests.get(
            search_url,
            headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"},
            timeout=REQUEST_TIMEOUT,
        )
        r.raise_for_status()
        html = r.text
        needle = domain.split(".")[0]
        listed = domain in html.lower() or (needle and needle in html.lower())
        out["listed"] = listed

        m = re.search(
            r'href="(https://www\.awwwards\.com/sites/[^"]+|/sites/[^"]+)"',
            html,
            re.I,
        )
        if m:
            href = m.group(1)
            profile = href if href.startswith("http") else f"https://www.awwwards.com{href}"
            out["profile_url"] = profile
            out["listed"] = True
            title_m = re.search(r'class="[^"]*title[^"]*"[^>]*>([^<]+)<', html, re.I)
            if title_m:
                out["title"] = title_m.group(1).strip()

        if out["listed"]:
            out["ok"] = True
            out["summary"] = (
                f"Listed on Awwwards"
                + (f" — {out['title']}" if out.get("title") else "")
                + (f" ({out['profile_url']})" if out.get("profile_url") else "")
            )
        else:
            out["ok"] = True
            out["summary"] = (
                "No Awwwards listing for this domain — expected for most local "
                "service sites. Award benchmarks target agency/creative work."
            )
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
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            try:
                ctx = browser.new_context(user_agent=UA, viewport={"width": 1280, "height": 900})
                page = ctx.new_page()
                page.set_default_timeout(PLAYWRIGHT_TIMEOUT_MS)
                page.goto("https://www.websiterating.com/", wait_until="domcontentloaded")
                page.wait_for_timeout(4000)

                result = page.evaluate(
                    """async (targetUrl) => {
                      try {
                        const r = await fetch('/api/audit', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: targetUrl })
                        });
                        const text = await r.text();
                        return { status: r.status, text };
                      } catch (e) {
                        return { status: 0, text: String(e) };
                      }
                    }""",
                    site_url,
                )
            finally:
                browser.close()

        status = int(result.get("status") or 0)
        text = str(result.get("text") or "")
        if status != 200:
            out["error"] = f"HTTP {status}: {text[:300]}"
            return out

        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            out["error"] = f"Non-JSON response: {text[:300]}"
            return out

        parsed = _parse_websiterating_payload(payload if isinstance(payload, dict) else {"raw": payload})
        parsed["ok"] = True
        return parsed
    except Exception as e:  # noqa: BLE001
        log.warning("websiterating intel failed: %s", e)
        out["error"] = str(e)[:400]
        return out


def gather_internal_intel(domain: str) -> dict:
    return {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "awwwards": fetch_awwwards(domain),
        "websiterating": fetch_websiterating(domain),
    }


def store_internal_intel(sb, report_id: str, intel: dict) -> None:
    sb.table("scorecard_reports").update({"internal_intel": intel}).eq("id", report_id).execute()
