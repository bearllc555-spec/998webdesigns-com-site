#!/usr/bin/env python3
"""
998 Web Designs — Website Scorecard Generator
==============================================

Feed it a list of domains. For each one it:
  1. Runs Google PageSpeed Insights (mobile)        -> speed signal
  2. Checks HTTPS / SSL                              -> security signal
  3. Crawls the homepage for title/meta/H1/schema    -> SEO signal
  4. Leaves reviews + conversion + design as MANUAL   (you fill these in)
  5. Computes a 0-100 score
  6. Writes a static personalised report page (index.html per prospect)
  7. Emits reports.csv with: domain, business_name, score, report_url

Two manual signals (reviews, conversion, design) default to a neutral mid
score and are clearly flagged as "manual review" on the page and in the CSV,
so nothing is dressed up as measured when it isn't.

USAGE
-----
  export PAGESPEED_API_KEY="your-key"        # from Google Cloud console, free
  python3 generate_reports.py leads.csv \
        --base-url https://998webdesigns.com/report \
        --out ./out

leads.csv format (header row required):
  domain,business_name,competitor_name,competitor_domain
  reliablejoesplumbing.com,Reliable Joe's Plumbing,Mike's Plumbing & Heating,mikesplumbingnj.com

competitor_* are optional. If competitor_domain is given, its speed score is
tested too and shown side-by-side. business_name defaults to a title-cased
guess from the domain if omitted.

The PageSpeed API key is free: console.cloud.google.com -> enable
"PageSpeed Insights API" -> create an API key. Without a key the public
endpoint is rate-limited to roughly one call every few seconds and will
throttle on a batch, so a key is strongly recommended.
"""

import argparse
import csv
import json
import os
import re
import socket
import ssl
import sys
import time
from datetime import date
from html import escape
from pathlib import Path
from urllib.parse import urlparse

import requests

PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

# ----- weights (must mirror the scorecard design) ----------------------------
MAX = {
    "speed": 25,
    "security": 15,
    "reviews": 20,      # manual
    "seo": 20,
    "conversion": 10,   # manual
    "design": 10,       # manual
}
MANUAL_SIGNALS = {"reviews", "conversion", "design"}


# ----- helpers ---------------------------------------------------------------
def normalise_domain(raw: str) -> str:
    raw = raw.strip().lower()
    raw = re.sub(r"^https?://", "", raw)
    raw = raw.split("/")[0]
    return raw.rstrip(".")


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "report"


def guess_name(domain: str) -> str:
    core = domain.split(".")[0]
    core = re.sub(r"[-_]+", " ", core)
    return core.title()


# ----- signal 1: PageSpeed (mobile) ------------------------------------------
def test_pagespeed(domain: str, api_key: str | None) -> dict:
    """Returns {ok, perf (0-100|None), lcp_s (float|None), error}."""
    params = {"url": f"https://{domain}", "strategy": "mobile"}
    if api_key:
        params["key"] = api_key
    try:
        r = requests.get(PAGESPEED_ENDPOINT, params=params, timeout=90)
        if r.status_code != 200:
            return {"ok": False, "perf": None, "lcp_s": None,
                    "error": f"HTTP {r.status_code}"}
        d = r.json()
        lh = d.get("lighthouseResult", {})
        perf = lh.get("categories", {}).get("performance", {}).get("score")
        perf = round(perf * 100) if perf is not None else None
        lcp_ms = (lh.get("audits", {})
                    .get("largest-contentful-paint", {})
                    .get("numericValue"))
        lcp_s = round(lcp_ms / 1000, 1) if lcp_ms else None
        return {"ok": True, "perf": perf, "lcp_s": lcp_s, "error": None}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "perf": None, "lcp_s": None, "error": str(e)[:120]}


def score_speed(ps: dict) -> tuple[int, str]:
    if not ps["ok"] or ps["perf"] is None:
        return 5, "We couldn't complete the mobile speed test on your site \u2014 often itself a sign the site is slow or unstable on phones."
    perf, lcp = ps["perf"], ps["lcp_s"]
    if perf >= 90:
        pts = 25
    elif perf >= 50:
        pts = 15
    else:
        pts = 5
    if lcp and lcp > 4 and pts > 5:
        pts -= 5
    lcp_txt = f" and takes {lcp} seconds to load" if lcp else ""
    line = (f"Your site scores {perf}/100 on Google's mobile test{lcp_txt}. "
            "Most callers are on a phone \u2014 many leave before it loads.")
    return pts, line


# ----- signal 2: SSL / HTTPS -------------------------------------------------
def test_ssl(domain: str) -> dict:
    """Returns {https_ok, error}. Verifies a TLS handshake + valid cert."""
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((domain, 443), timeout=15) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                ssock.getpeercert()  # raises if invalid
        return {"https_ok": True, "error": None}
    except Exception as e:  # noqa: BLE001
        return {"https_ok": False, "error": str(e)[:120]}


def score_security(ssl_res: dict) -> tuple[int, str]:
    if ssl_res["https_ok"]:
        return 15, "Your site has a valid security certificate \u2014 good. This is one area you're not losing trust on."
    return 0, ("Your site shows \u201cNot Secure\u201d in the address bar. "
               "Customers see a browser warning before they reach you.")


# ----- signal 4: on-page SEO -------------------------------------------------
def test_seo(domain: str) -> dict:
    """Fetch homepage, inspect title / meta description / H1 / schema."""
    for scheme in ("https", "http"):
        try:
            r = requests.get(f"{scheme}://{domain}", timeout=20,
                             headers={"User-Agent": "Mozilla/5.0 (998WebDesigns Scorecard)"})
            html = r.text
            title = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
            title = title.group(1).strip() if title else ""
            meta = re.search(
                r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
                html, re.I | re.S)
            meta = meta.group(1).strip() if meta else ""
            h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
            has_h1 = bool(h1)
            has_schema = bool(re.search(r'application/ld\+json', html, re.I)) or \
                bool(re.search(r'itemtype=["\']https?://schema\.org', html, re.I))
            return {"ok": True, "title": title, "meta": meta,
                    "has_h1": has_h1, "has_schema": has_schema, "error": None}
        except Exception as e:  # noqa: BLE001
            last = str(e)[:120]
    return {"ok": False, "title": "", "meta": "", "has_h1": False,
            "has_schema": False, "error": last}


def score_seo(seo: dict, domain: str) -> tuple[int, str]:
    if not seo["ok"]:
        return 5, "We couldn't read your homepage to check its SEO \u2014 which usually means search engines struggle with it too."
    gaps = []
    if not seo["title"]:
        gaps.append("no title tag")
    elif not re.search(r"[A-Za-z]{3,}", seo["title"]):
        gaps.append("an empty title tag")
    if not seo["meta"]:
        gaps.append("no meta description")
    if not seo["has_h1"]:
        gaps.append("no main heading")
    if not seo["has_schema"]:
        gaps.append("no business schema markup")
    n = len(gaps)
    if n == 0:
        return 20, "Your on-page SEO basics are present. There's still room to win on local keywords, but the foundation is here."
    if n <= 2:
        pts = 10
    else:
        pts = 0
    gap_txt = ", ".join(gaps[:3])
    line = (f"Your homepage has {gap_txt}. "
            "Google can't clearly tell what you do or which town you serve.")
    return pts, line


# ----- manual signals --------------------------------------------------------
def manual_defaults() -> dict:
    """Neutral mid scores, flagged manual. Edit per-prospect after generation."""
    return {
        "reviews": {
            "pts": 10, "max": MAX["reviews"],
            "line": "Check Google reviews vs. a top local competitor and edit this. "
                    "Placeholder: review profile looks thin next to competitors.",
        },
        "conversion": {
            "pts": 6, "max": MAX["conversion"],
            "line": "Confirm by eye and edit. Placeholder: no obvious tap-to-call "
                    "button above the fold for a customer in a hurry.",
        },
        "design": {
            "pts": 6, "max": MAX["design"],
            "line": "Confirm by eye and edit. Placeholder: layout looks built for "
                    "desktop and dated on a phone.",
        },
    }


# ----- verdict ---------------------------------------------------------------
def verdict_for(score: int) -> tuple[str, str]:
    if score >= 80:
        return ("good", "Your site is in good shape \u2014 a few tune-ups and you're set.")
    if score >= 50:
        return ("warning", "Your site is functional but leaking calls. Here's exactly where.")
    return ("danger", "This site is actively costing you jobs every week. Here's exactly where.")


# ----- signal 3 (Door 2 automated): Google reviews via Places API -----------
def test_reviews(query: str, api_key: str | None) -> dict:
    """Look up a business on Google Places, return review count + rating.

    `query` is the business name + locality (e.g. "Reliable Joe's Plumbing
    Torrington CT") or a domain to text-search. Requires PLACES_API_KEY.
    Returns {ok, count (int|None), rating (float|None), error}.
    """
    if not api_key:
        return {"ok": False, "count": None, "rating": None,
                "error": "no PLACES_API_KEY"}
    try:
        # Places API (New) Text Search
        r = requests.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask":
                    "places.userRatingCount,places.rating,places.displayName",
            },
            json={"textQuery": query}, timeout=20)
        if r.status_code != 200:
            return {"ok": False, "count": None, "rating": None,
                    "error": f"HTTP {r.status_code}"}
        places = r.json().get("places", [])
        if not places:
            return {"ok": True, "count": 0, "rating": None, "error": None}
        top = places[0]
        return {"ok": True,
                "count": top.get("userRatingCount", 0),
                "rating": top.get("rating"), "error": None}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "count": None, "rating": None, "error": str(e)[:120]}


def score_reviews(rev: dict, competitor_count: int | None = None) -> tuple[int, str]:
    """Score the reviews signal. Mirrors the Phase 1 manual banding, automated."""
    if not rev["ok"]:
        return 10, ("We couldn't automatically read your Google reviews \u2014 "
                    "we'll confirm these with you directly.")
    count, rating = rev["count"] or 0, rev["rating"]
    if count >= 50 and (rating or 0) >= 4.5:
        pts = 20
    elif count >= 20:
        pts = 10
    else:
        pts = 0
    cmp_txt = (f" {competitor_name_phrase(competitor_count)}"
               if competitor_count else "")
    rating_txt = f", averaging {rating}\u2605" if rating else ""
    line = (f"You have {count} Google review{'s' if count != 1 else ''}"
            f"{rating_txt}.{cmp_txt} Reviews are what most customers check first.")
    return pts, line


def competitor_name_phrase(competitor_count: int) -> str:
    return f"A top local competitor has {competitor_count}."
