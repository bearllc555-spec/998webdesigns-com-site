# 998webdesigns.com — Project Handoff

This file is read at the start of every session that touches 998webdesigns.com. It captures every system, credential reference, file path, and architectural decision so a fresh Claude session (or Anthony, or a future operator) has full context without re-deriving anything. Lives at the repo root so it travels with the codebase.

---

## Status (as of 2026-05-12)

**LIVE** at https://998webdesigns.com/ and https://www.998webdesigns.com/. SSL active on both. Apex + www attached to Cloudflare Pages project `998webdesigns-com`.

**Brand:** standalone Bear LLC product brand for **$998 custom websites**. Mercury-clean splash. **NO Slatepress reference anywhere.** Footer attribution is `a bear llc digital property` only. This is intentional positioning — 998webdesigns sells against the "$998 once" anchor without dragging Slatepress's velvet-rope or vertical-brand framing into the conversation.

**Site content (current splash):**
- H1: *"a real website for your business."*
- Lead: $998 once messaging
- Primary CTA: `mailto:hello@998webdesigns.com`
- "What's included" list with 5 checkmarks
- Footer: "a bear llc digital property"
- Mercury aesthetic: white background, Inter font, blue (`#2563EB`) accent, lowercase H1, `v0X` version label next to brand mark

---

## Offer spec — see `./offer.md`

The product offer mechanics (pricing tiers, page-count rules, changes policy, blog inclusion, upsell roadmap, all open product questions) are documented in `offer.md` next to this file. Drafted 2026-05-13 from a vision-chat session. Read it alongside this CLAUDE.md — they're siblings, not duplicates: CLAUDE.md is the operational/infra handoff, `offer.md` is the product spec. Either file is incomplete on its own.

---

## Quick links

| Surface | URL |
|---|---|
| Live site | https://998webdesigns.com/ |
| www mirror | https://www.998webdesigns.com/ |
| CF Pages preview | https://998webdesigns-com.pages.dev/ |
| Source repo (public) | https://github.com/bearllc555-spec/998webdesigns-com-site |
| GitHub Actions | https://github.com/bearllc555-spec/998webdesigns-com-site/actions |
| CF Pages project | https://dash.cloudflare.com/e0f6f68f26f8a26a75eaa793385019ef/pages/view/998webdesigns-com |
| CF DNS records | https://dash.cloudflare.com/e0f6f68f26f8a26a75eaa793385019ef/998webdesigns.com/dns/records |

---

## Domain & DNS

- **Domain:** `998webdesigns.com`
- **Registrar:** Hostinger (transfer to Cloudflare Registrar eligible after ICANN 60-day lock + Hostinger 30-day cooling-off)
- **Nameservers (at Hostinger):** Cloudflare-assigned pair — confirm on the CF zone overview before re-pointing. Existing established zones use `aiden.ns.cloudflare.com` + `piper.ns.cloudflare.com`; newer zones may have been assigned `hunts` / `suzanne`. **Always verify the exact pair on the zone's "Update your nameservers to activate Cloudflare" screen BEFORE setting Hostinger NS records** — wrong pair causes silent SERVFAIL "lame delegation" for days.
- **Cloudflare zone:** ZoneID `56f3ac75a0c268a2cbef7d5eadf2d8ba`, Free plan, Active.

**DNS records (Cloudflare):**

| Type | Name | Content | Proxy | Purpose |
|---|---|---|---|---|
| CNAME | `@` (apex) | `998webdesigns-com.pages.dev` | Proxied (orange) | Apex → CF Pages |
| CNAME | `www` | `998webdesigns-com.pages.dev` | Proxied (orange) | www → CF Pages |

No mail records yet. If `hello@998webdesigns.com` ever needs to be a real mailbox (vs. just the `mailto:` CTA target with delivery handled elsewhere), add the same Google Workspace domain-alias pattern documented in slatepress/CLAUDE.md (MX + SPF + DKIM + DMARC + Workspace verification TXT).

---

## Cloudflare account

- **Account ID:** `e0f6f68f26f8a26a75eaa793385019ef`
- **Account email:** `bearllc555@gmail.com`
- **Pages project:** `998webdesigns-com`
- **Custom domains attached:** `998webdesigns.com` (apex) + `www.998webdesigns.com`
- **SSL:** Active on both
- **Deploy mechanism:** **git-wired auto-deploy** via `cloudflare/wrangler-action@v3` on push to `main`. Direct Upload zip-drag is not used for this site.

---

## GitHub repo

- **URL:** https://github.com/bearllc555-spec/998webdesigns-com-site
- **Visibility:** public
- **Default branch:** `main`
- **Owner:** `bearllc555-spec` (org)

**Auto-deploy workflow** at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy . --project-name=998webdesigns-com
```

**Required repo secrets (already set):**

- `CLOUDFLARE_API_TOKEN` — token name `plumbingslatepress-com-site-github-actions` (reused across all bearllc555-spec Pages projects; scope: Account → Cloudflare Pages → Edit, Account Resources: All accounts). Stored locally at `slatepress/.local/cf-pages-token.txt`.
- `CLOUDFLARE_ACCOUNT_ID` — `e0f6f68f26f8a26a75eaa793385019ef`

**PAT used for git push:**

- `slatepress-demos-deploy` — broader-scope PAT, all repos under `bearllc555-spec`. Stored at `slatepress/.local/slatepress-demos-deploy-pat.txt`.
- **Limitation:** PAT does NOT include `Workflow write` scope. Cannot push or modify `.github/workflows/*` files. Workflow file edits go through the **GitHub web UI** (one-time concern; the workflow file is stable).

---

## Local workspace layout

The repo is cloned locally at:

```
C:\Users\thede\OneDrive\Documents\Claude\slatepress\repos\998webdesigns-com-site\
├── CLAUDE.md            ← this file (project context)
├── README.md            ← public repo overview
├── index.html           ← the single splash page (Mercury-clean, ~XXX lines)
├── favicon.svg          ← blue-slash favicon
└── .github/
    └── workflows/
        └── deploy.yml   ← auto-deploy on push to main
```

Cursor reads from this path directly. `CLONE-REPOS.cmd` at the slatepress workspace root will re-clone if the folder is ever missing.

---

## How to edit and ship a change

There are two workflows. **Cursor is the default for any code work as of 2026-05-11.**

### Path A — Cursor (default, code work)

This is the cockpit Anthony uses for code. ~90-second feedback loop, no widget toolchain to fail.

1. **Open Cursor.** Project root: `C:\Users\thede\OneDrive\Documents\Claude\slatepress\repos\998webdesigns-com-site\`
2. **Pull latest from origin first** (especially after a Cowork session that may have committed): `git pull origin main`
3. **Make the edit.** Cursor's Claude integration handles file edits directly — no widget layer.
4. **Bump the `v0X` version label** in `index.html` (the tiny slate-light text next to the brand mark). One bump per commit. This is the deploy-propagation tell.
5. **Branch first.** Never push directly to `main`. Create a feature branch like `polish/h1-tweak` or `fix/footer-copy`, push it, and let Cloudflare Pages auto-deploy a preview to `<branch-slug>.998webdesigns-com.pages.dev`. Review the preview, then merge to `main` to ship to production.
6. **Commit message: ASCII-only.** No em-dashes (`—`), no curly quotes (`'`/`"`), no Unicode sparkles. Cloudflare Pages deployments API rejects non-ASCII commit messages with `[code: 8000111] Invalid commit message UTF-8`. Use straight hyphens and quotes.
7. **One commit per change.** Never push two commits within ~10 seconds. CF Pages dedups/drops the second one. The `v0X` label makes this observable — if the live site doesn't show your bumped version after ~60s, you got dropped.
8. **Push.** Git Credential Manager handles auth (one-time browser OAuth on first push). PAT is not embedded in the remote URL.
9. **Verify on the preview URL,** then merge the PR on GitHub. Auto-deploy fires on the merge commit; live site updates in ~30-60s.

### Path B — Cowork bash sandbox + /tmp (fallback when Cursor isn't open and the change is small)

Mirror of the webhosting197 pattern. Useful for one-line copy fixes when Anthony is on his phone, or when the bash sandbox is healthy.

1. Clone (or refresh) the repo into `/tmp/998-work/` in the bash sandbox — **NOT** inside the OneDrive mount, because OneDrive Files-On-Demand corrupts `.git/` index files.
2. Edit the file in `/tmp/998-work/`, bump `v0X`, single `git add/commit/push` from there.
3. Sync the changed file back into OneDrive `repos/998webdesigns-com-site/` so file tools see the latest on next session: `cat /tmp/998-work/index.html > $ROOT/repos/998webdesigns-com-site/index.html`.
4. Same ASCII-commit-message + branch-first + one-commit-per-change rules apply.

### What NOT to do

- Don't edit files in OneDrive `repos/998webdesigns-com-site/` and then `git push` from a `/tmp/998-work/` checkout that's out of sync with what Cursor has been editing. Pick one cockpit per change.
- Don't bypass branch previews. Never push directly to `main`.
- Don't bake the PAT into the remote URL on the long-lived `repos/` clone. `CLEANUP-REMOTES.cmd` strips PATs if one slipped in.
- Don't use the GitHub upload UI for files >2KB. Drag-drop works for small files but the Chrome MCP can't drive it (browser security on `<input type="file">`); larger files use `git push` or web-UI drag-drop in Anthony's actual browser.

---

## Brand & design rules (locked)

These are non-negotiable for 998webdesigns:

1. **Zero Slatepress mention.** Not in copy, not in meta tags, not in JSON-LD, not in source comments. The whole brand premise is that this is a clean Bear LLC product, not a Slatepress vertical.
2. **Footer attribution is `a bear llc digital property` only.** No "another SlatePress company" line. No company-architecture explanation.
3. **Mercury-clean visual system:** white background (`#FFFFFF`), Inter font, ink-black text, blue (`#2563EB`) accent, lowercase H1, thin ink-black borders on cards/inputs, pulsing emerald dot for any scarcity or "live" indicators.
4. **`v0X` version label next to brand mark.** Tiny slate-light text adjacent to `998webdesigns`. Bumps every commit. Diagnoses CF Pages propagation at a glance.
5. **`mailto:hello@998webdesigns.com` is the primary CTA target.** No form-capture, no Formspree, no SendGrid OTP. Anthony's inbox is the funnel for now.
6. **$998 once is the price anchor.** Not "$998/mo", not "starting at $998". Flat one-time fee. Same pain-removal framing as webhosting197 ("one less bill to worry about. for life.") — different surface, same psychology.
7. **Brand mark color treatment:** if a future polish pass adds a colored accent to the brand mark, follow the slatepress portfolio pattern — blue-slash + ink-black text. Don't invent a new convention.

---

## Operational rules (inherit from slatepress)

These apply equally to 998webdesigns and are documented exhaustively in `slatepress/CLAUDE.md`:

- **Branch previews mandatory** — every change ships to a feature branch first.
- **Code work in Cursor, non-code work in Cowork.**
- **One commit per change**, never two within ~10s.
- **ASCII-only commit messages** for any repo wired to `cloudflare/wrangler-action@v3`.
- **`.local/` is sacred** — gitignored everywhere, holds all secrets, never committed.
- **OneDrive Files-On-Demand truncation gotcha** — never `cp -r` from OneDrive paths in bash; either use `/tmp/` workspaces or use the file tools (`Read`/`Edit`/`Write`) which resolve OneDrive correctly.
- **Pre-stage tabs FIRST, ask second.** If asking Anthony to do anything in the browser (CF dashboard, GitHub UI, DNS records), navigate Chrome to the exact page first — don't make him hunt.

---

## Recovery / cold restart

If everything went sideways:

1. **Domain still resolves?** Check https://998webdesigns.com/. If 5xx: check CF Pages dashboard. If DNS broken: check the DNS records section above and re-create the two CNAMEs.
2. **Repo gone locally?** `CLONE-REPOS.cmd` at slatepress workspace root re-clones it. Or manually: `git clone https://github.com/bearllc555-spec/998webdesigns-com-site repos/998webdesigns-com-site`.
3. **CF Pages project deleted?** Re-create at https://dash.cloudflare.com/e0f6f68f26f8a26a75eaa793385019ef/pages/new — name `998webdesigns-com`, connect GitHub repo `bearllc555-spec/998webdesigns-com-site`, branch `main`, build command empty, output dir `.`. Then re-attach `998webdesigns.com` and `www.998webdesigns.com` as custom domains.
4. **Workflow secrets wiped?** Re-add `CLOUDFLARE_API_TOKEN` (from `slatepress/.local/cf-pages-token.txt`) and `CLOUDFLARE_ACCOUNT_ID` (`e0f6f68f26f8a26a75eaa793385019ef`) at https://github.com/bearllc555-spec/998webdesigns-com-site/settings/secrets/actions.
5. **PAT rotated?** Run `UPDATE-PAT-AND-CLEAN.cmd` at the slatepress workspace root.

---

## What's deferred / open

- **Real `hello@998webdesigns.com` mailbox.** Currently the mailto: relies on whatever client Anthony's prospects use; replies land wherever the recipient address is configured to deliver. If volume picks up, add 998webdesigns.com as a Google Workspace domain alias under the slatepress.co tenant (same pattern as plumbingslatepress.com — see slatepress/CLAUDE.md "Wired & working" section).
- **Form-capture vs. mailto.** No form yet. If conversion needs measurement, add a Formspree form (use a NEW Formspree form, not the shared `xykonjqq` or `xjgjwobq` — keep this brand's intake clean).
- **Offer copy validation.** $998 once needs market signal. Once 5-10 inquiries land, lock the page or A/B test a price point.
- **Branch preview verification.** Confirmed-working pattern on `slatepress-site` 2026-05-11; presumed default-on for `998webdesigns-com` Pages project. Verify on first feature-branch push — should auto-deploy to `<branch>.998webdesigns-com.pages.dev` within ~30s.
- **Schema.org JSON-LD + 1200×630 og:image.** webhosting197.com has both (unlocks rich link previews on FB/LinkedIn/Twitter + Google knowledge panel). 998webdesigns doesn't yet. Quick polish win when traffic picks up.

---

## Session log

| Date | Event |
|---|---|
| 2026-05-12 | Repo created (`bearllc555-spec/998webdesigns-com-site`), Mercury-clean splash shipped, CF Pages project `998webdesigns-com` provisioned via API, custom domains apex + www attached, DNS CNAMEs created via PowerShell+CF API, SSL active. End-to-end live. |
| 2026-05-12 | `PUSH-998WEBDESIGNS.cmd` and `SET-998-DNS.cmd/.ps1` one-shot scripts deleted from slatepress workspace root after the project went live (transient setup; not utilities). |
| 2026-05-12 | This handoff doc written and committed to repo root as `CLAUDE.md`. |
