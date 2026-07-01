#!/usr/bin/env python3
"""
Website Scorecard — Supabase generator
======================================
Runs the 6-signal scorer for one lead and UPSERTS the result into Supabase,
returning the tokenized report URL (+ ids) for the email step.

Two report shapes share ONE core (do not fork scoring per door):
  * Door 1 (outbound): full six-signal report. reviews + conversion + design
    are MANUAL (Anthony hand-edits before send).
  * Door 2 (form): reviews is AUTOMATED via Google Places (source='tool');
    conversion + design render LOCKED (points NULL, locked=true) until a call
    is booked. HARD RULE: we only lock signals we have NOT measured — never
    hide a measured score.

Scoring logic lives in scorer_core.py and is unchanged. This module handles:
token creation, DB writes, idempotency/supersede, dedup, and returning the URL.

ENV (server-side only — never ship to the browser):
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY      # service role; bypasses RLS; writes only
    PAGESPEED_API_KEY
    PLACES_API_KEY                 # Door 2 reviews signal
    PUBLIC_BASE_URL                # e.g. https://998webdesigns.com (no trailing /)
    BOOKING_URL                    # CTA target
"""

import argparse
import os
import secrets
import sys
from datetime import date, datetime, timedelta, timezone

import scorer_core as core

try:
    from supabase import create_client, Client
except ImportError:
    print("Run: pip install supabase", file=sys.stderr)
    raise

DEDUP_DAYS = int(os.environ.get("DEDUP_DAYS", "14"))


def _client() -> "Client":
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # service role, server-side ONLY
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Signal assembly
# ---------------------------------------------------------------------------
def _tool_signals(domain, competitor_domain, api_key):
    """The 3 always-tool signals (speed, security, seo) + competitor speed."""
    ps = core.test_pagespeed(domain, api_key)
    sp_pts, sp_line = core.score_speed(ps)
    sslr = core.test_ssl(domain)
    se_pts, se_line = core.score_security(sslr)
    seo = core.test_seo(domain)
    seo_pts, seo_line = core.score_seo(seo, domain)

    comp_score = None
    if competitor_domain:
        cps = core.test_pagespeed(competitor_domain, api_key)
        if cps["ok"] and cps["perf"] is not None:
            comp_score = max(55, min(95, cps["perf"]))

    signals = [
        dict(key="speed", name="Mobile speed & experience", points=sp_pts,
             max_points=core.MAX["speed"], line=sp_line, source="tool",
             source_name="Google PageSpeed Insights", sort_order=1, locked=False),
        dict(key="security", name="Security & trust", points=se_pts,
             max_points=core.MAX["security"], line=se_line, source="tool",
             source_name="SSL Labs", sort_order=2, locked=False),
        dict(key="seo", name="SEO & findability", points=seo_pts,
             max_points=core.MAX["seo"], line=seo_line, source="tool",
             source_name="Homepage crawl", sort_order=4, locked=False),
    ]
    return signals, comp_score


def _reviews_signal_door1():
    """Manual reviews placeholder (Door 1 — Anthony edits before send)."""
    man = core.manual_defaults()
    return dict(key="reviews", name="Google profile & reviews",
                points=man["reviews"]["pts"], max_points=core.MAX["reviews"],
                line=man["reviews"]["line"], source="manual",
                source_name="Manual review", sort_order=3, locked=False)


def _reviews_signal_door2(business_name, domain, places_key, competitor_count=None):
    """Automated reviews via Google Places (Door 2). source='tool'."""
    query = f"{business_name} {domain}".strip()
    rev = core.test_reviews(query, places_key)
    pts, line = core.score_reviews(rev, competitor_count)
    return dict(key="reviews", name="Google profile & reviews",
                points=pts, max_points=core.MAX["reviews"], line=line,
                source="tool", source_name="Google Places", sort_order=3,
                locked=False)


def _manual_signals_door1():
    man = core.manual_defaults()
    return [
        dict(key="conversion", name="Conversion readiness",
             points=man["conversion"]["pts"], max_points=core.MAX["conversion"],
             line=man["conversion"]["line"], source="manual",
             source_name="Manual review", sort_order=5, locked=False),
        dict(key="design", name="Design currency",
             points=man["design"]["pts"], max_points=core.MAX["design"],
             line=man["design"]["line"], source="manual",
             source_name="Manual review", sort_order=6, locked=False),
    ]


def _locked_signals_door2():
    """Conversion + design: NOT measured at submit time -> rendered LOCKED.
    points=None (NULL in DB), locked=True. Honest: 'not yet assessed'."""
    return [
        dict(key="conversion", name="Conversion readiness",
             points=None, max_points=core.MAX["conversion"],
             line="Book a call to unlock your conversion review — we assess "
                  "this by hand so it's accurate, not guessed.",
             source="manual", source_name="Unlocked after a call",
             sort_order=5, locked=True),
        dict(key="design", name="Design currency",
             points=None, max_points=core.MAX["design"],
             line="Book a call to unlock your design review — assessed by "
                  "hand, not by a script.",
             source="manual", source_name="Unlocked after a call",
             sort_order=6, locked=True),
    ]


# ---------------------------------------------------------------------------
# Dedup (Door 2): reuse a recent active report for the same domain
# ---------------------------------------------------------------------------
def find_recent_report(sb, domain, days=DEDUP_DAYS):
    """Return the most recent active report dict for `domain` generated within
    `days`, or None. Used by Door 2 to avoid re-running PageSpeed + a browser."""
    domain = core.normalise_domain(domain)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    res = (sb.table("scorecard_reports")
             .select("id, token, score, verdict")
             .eq("domain", domain).eq("status", "active")
             .gte("created_at", cutoff)
             .order("created_at", desc=True).limit(1).execute())
    return res.data[0] if res.data else None


# ---------------------------------------------------------------------------
# Core generation
# ---------------------------------------------------------------------------
def generate_for_lead(lead_id, domain, business_name,
                      competitor_name=None, competitor_domain=None,
                      source_door="outbound", competitor_count=None):
    """Score one lead, upsert into Supabase, return a dict:
        { 'url', 'report_id', 'token', 'score', 'verdict', 'verdict_line', 'domain' }

    Idempotent: supersedes any prior active report for this lead (history kept
    via status='superseded' + superseded_at) and inserts a fresh one.

    source_door: 'outbound' (Door 1, full manual signals) or 'form' (Door 2,
    automated reviews + locked conversion/design).
    """
    api_key = os.environ.get("PAGESPEED_API_KEY")
    places_key = os.environ.get("PLACES_API_KEY")
    base = os.environ["PUBLIC_BASE_URL"].rstrip("/")
    sb = _client()

    domain = core.normalise_domain(domain)
    comp_domain = core.normalise_domain(competitor_domain or "") or None

    tool_sigs, comp_score = _tool_signals(domain, comp_domain, api_key)

    if source_door == "form":
        reviews = _reviews_signal_door2(business_name, domain, places_key,
                                        competitor_count)
        tail = _locked_signals_door2()
    else:
        reviews = _reviews_signal_door1()
        tail = _manual_signals_door1()

    signals = tool_sigs + [reviews] + tail
    signals.sort(key=lambda s: s["sort_order"])

    # Score: locked signals contribute 0 to the displayed running total but the
    # report stays honest because the renderer shows them as "not yet assessed,"
    # not as a measured 0. (Their max_points still count toward the 100 ceiling.)
    score = sum((s["points"] or 0) for s in signals)
    verdict_class, verdict_text = core.verdict_for(score)
    token = secrets.token_urlsafe(24)  # ~192 bits

    # supersede old active reports for this lead (preserve history)
    sb.table("scorecard_reports").update(
        {"status": "superseded", "superseded_at": datetime.now(timezone.utc).isoformat()}
    ).eq("lead_id", lead_id).eq("status", "active").execute()

    rep = sb.table("scorecard_reports").insert({
        "lead_id": lead_id,
        "token": token,
        "domain": domain,
        "business_name": business_name,
        "score": score,
        "verdict": verdict_class,
        "competitor_name": competitor_name,
        "competitor_score": comp_score,
        "tested_on": date.today().isoformat(),
        "status": "active",
        "source_door": source_door,
    }).execute()
    report_id = rep.data[0]["id"]

    for s in signals:
        s["report_id"] = report_id
    sb.table("scorecard_signals").insert(signals).execute()

    return {
        "url": f"{base}/r/{token}",
        "report_id": report_id,
        "token": token,
        "score": score,
        "verdict": verdict_class,
        "verdict_line": verdict_text,
        "domain": domain,
    }


def set_screenshots(sb, report_id, analysis_url=None, site_url=None):
    patch = {}
    if analysis_url:
        patch["screenshot_url"] = analysis_url
    if site_url:
        patch["site_screenshot_url"] = site_url
    if patch:
        sb.table("scorecard_reports").update(patch).eq("id", report_id).execute()


def set_email_status(sb, report_id, status, bounced=False):
    patch = {"email_status": status}
    if bounced:
        patch["email_bounced_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("scorecard_reports").update(patch).eq("id", report_id).execute()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lead-id", required=True)
    ap.add_argument("--domain", required=True)
    ap.add_argument("--business", required=True)
    ap.add_argument("--competitor-name", default=None)
    ap.add_argument("--competitor-domain", default=None)
    ap.add_argument("--door", default="outbound", choices=["outbound", "form"])
    args = ap.parse_args()
    out = generate_for_lead(args.lead_id, args.domain, args.business,
                            args.competitor_name, args.competitor_domain,
                            source_door=args.door)
    print(out["url"])


if __name__ == "__main__":
    main()
