# 998webdesigns-com-site — Project Handoff

Read at the start of every session that touches this repo. Stack, env, file layout, deploy flow, and what is wired vs deferred.

---

## Status (production — 2026-06)

**Live on Vercel** at https://998webdesigns.com — project **`998webdesigns-com-site`**. GitHub `bearllc555-spec/998webdesigns-com-site`. Site version label in nav/footer (`lib/version.ts`, currently v32.x).

Pricing copy in `components/Pricing.tsx` is from the locked product brief. **Do not change pricing wording without explicit approval — the pricing language is the product.**

---

## What ships today

- Home (`/`) — Hero, add-ons, portfolio carousel (hover preview videos on most cards), value props, how it works, pricing, FAQ, **5-step lead form** (must pick `monthly` or `lifetime` hosting — no "decide later"), footer. Light/dark theme toggle.
- `/portfolio`, `/pricing`, `/start` — standalone marketing routes (same components as home sections; canonical nav targets).
- `/thanks` — post-payment timeline; requires paid Stripe `session_id` (no spoofing via query string).
- `/legal/terms`, `/legal/privacy` — operator-drafted legal copy aligned to Stripe + lead form flow.
- **`/api/leads`** — POST: honeypot, full server validation (`lib/validate-lead.ts`), Supabase `wd_leads` insert, Stripe Checkout for **design fee only** (+ 3% card surcharge on design), Resend checkout-link email. Promo codes in `lib/design-promo-codes.ts` (channel-specific; **LINKEDIN20 not on public FAQ**).
- **`/api/contact`** — POST: honeypot, Supabase `contact_submissions` insert, Resend to hello@998webdesigns.com.
- **`/api/stripe/webhook`** — signed webhook; design `checkout.session.completed` syncs lead + internal email; **lifetime hosting** path on day-31 Checkout + ACH pending alerts (`lib/internal-lead-email.ts`, `lib/crm-notify.ts`). Idempotency via `processed_stripe_events` + `lib/stripe-webhook-idempotency.ts`.
- **`/api/cron/ten-year-hosting`** — daily 14:00 UTC (`vercel.json`); bills **lifetime hosting $2,996** on day 31 for leads that chose `lifetime`. Auth: `CRON_SECRET` or `BALANCE_CAPTURE_SECRET` bearer.
- **`/api/admin/env-status`** — GET production wiring snapshot (no secret values). Bearer: `BALANCE_CAPTURE_SECRET`.
- **`/api/admin/migrate-hosting-billing`** — POST idempotent migration for `hosting_billing_starts_at` columns. Bearer: `BALANCE_CAPTURE_SECRET`.
- **`/hosting/manage`** — month-to-month clients request a magic link to Stripe Customer Portal (`POST /api/hosting/portal/request`, `GET /api/hosting/portal/session`).
- **Hosting policy** (`lib/hosting-policy.ts`, `lib/checkout-session.ts`) — first **30 days hosting free** for everyone; **monthly** = $98/mo after Stripe trial; **lifetime** = $2,996 deferred to day 31 (`lib/ten-year-hosting-billing.ts`).
- **Checkout origins** — `lib/checkout-origin.ts` allowlist (no open redirect via `Origin`).
- **Stripe go-live** — `DEPLOYMENT.md` + `lib/stripe-env.ts` warns if Production still uses `sk_test_`.
- SEO — `robots.txt`, `sitemap.xml`, `index, follow` on marketing pages; `/thanks` noindex.
- OG image — `app/opengraph-image.tsx`.
- Rate limiting — `proxy.ts` (in-memory) + Supabase `api_rate_limits` when table exists (`lib/api-rate-limit.ts`).
- Analytics — `@vercel/analytics` in root layout.
- **CRM** — `/crm` (auth: `CRM_ADMIN_SECRET` required in production), feed from `wd_leads` + `contact_submissions`, `/crm/telegram` for bot token + chat ids (`crm_telegram_settings`; env vars are fallback). CRM version: `lib/crm-version.ts` — bump on every CRM change.
- **Plumbing Jarvis demo** — `/demo/plumbers` (Gemini Live voice agent for Metro Plumbing & Drain). Sign-in → FAQ → booking with $50 coupon → PA-style intake → confirmation email. Canonical flow: **`docs/jarvis-plumbing-appointment-flow.md`**. Knowledge/emails: `docs/jarvis_plumbing_complete.md`. Ops: `VOICE-DEMO-OPS.md`. Real sign-ins on `/crm` under **Plumbing Jarvis demos** (`plumbing_demo`).
- **Alerts** — Resend internal emails + Telegram via CRM notify kinds (`lifetime_hosting_paid`, `lifetime_hosting_ach_pending`, design payment, etc.). No Slack.

---

## Production ops checklist (items 1–5)

| # | Task | Status (2026-06-02) |
|---|---|---|
| **1** | Supabase migrations on **helmet** (`xwldbxburzqryxlzocck`) | **Verified via env-status** — `wd_leads`, `api_rate_limits`, `contact_submissions`, `stripe_subscription_id`, `crm_telegram_settings`, `processed_stripe_events` all present. **Hosting billing columns** probed by env-status after v32.93 (`hostingBillingColumns`). If missing: `POST /api/admin/migrate-hosting-billing` or `node scripts/apply-hosting-billing-migration.mjs` (needs current DB password in `slatepress/.local/`). |
| **2** | Stripe webhook subscription events | **Done** — env-status reports `invoice.payment_failed` + `customer.subscription.deleted` on live webhook; `missingSubscriptionWebhookEvents: []`. |
| **3** | Live checkout E2E | **Done** — $1 live smoke (`cs_live_a1md3zcykOuvz5fXJx3RaVfbaxL6fBUe76edhc6BM8sBVPnmr5vXcZqxaB`): Checkout paid, `/thanks` rendered, Resend receipt + hello@ alert, Telegram fired. Open checkout via `smoke-checkout-open.html` (URL hash required). |
| **4** | `env-status` clean | **Done** — `GET /api/admin/env-status` with `BALANCE_CAPTURE_SECRET`: `warnings: []`, `readyForLiveCharges: true`, Stripe mode `live`, CRM `crmAdminSecretSource: dedicated`. Re-check after any Vercel env or schema change. |
| **5** | `CRON_SECRET` on Vercel | **Optional** — cron route already accepts `BALANCE_CAPTURE_SECRET` as fallback. Set dedicated `CRON_SECRET` only if you want cron auth separate from admin bearer. |

Quick re-check:

```bash
curl -s https://998webdesigns.com/api/admin/env-status \
  -H "Authorization: Bearer $BALANCE_CAPTURE_SECRET"
```

---

## Portfolio dev URLs (locked — 2026-06-06)

Carousel links and poster capture URLs in `data/portfolio.ts`. **Do not change these back to apex or stale domains unless Anthony explicitly instructs.**

| Slug | URL |
|------|-----|
| serenity-spa | https://serenity-spa-3r8.pages.dev/ |
| tuscano-excavating | https://tuscano-excavating.pages.dev/ |
| jetvip-charter | https://jetvipcharter-dev.pages.dev/ |
| borst-landscape | https://landscape-design-site-cui.pages.dev/ |
| yogacentric | https://yogacentric-com-site.pages.dev/ |
| new-empire-corp | https://dev.nyc-design.pages.dev/ |
| pocono-vacation-homes | https://dev.vacation-homes.pages.dev/ |
| legally-design | https://dev.legally-design.pages.dev/ |

Re-capture posters: `npm run capture-portfolio-poster -- <slug> <url>` (see `scripts/capture-portfolio-poster.mjs`).

---

## Deferred / backlog

- **Lawyer review** — Terms/Privacy are operator-drafted.

---

## Quick links

| Surface | URL |
|---|---|
| Repo | https://github.com/bearllc555-spec/998webdesigns-com-site |
| Production | https://998webdesigns.com |
| Vercel project | `bearllc555-6551s-projects/998webdesigns-com-site` |
| Supabase | **supabase-998webdesigns-helmet** (ref `xwldbxburzqryxlzocck`) |

---

## Stack

- **Next.js 16** — App Router, TypeScript, `app/` at repo root (no `src/`), Tailwind CSS v4 (`app/globals.css` @theme)
- **Fonts** — Inter (body) + Geist (display via `font-display`)
- **Supabase** — Postgres on helmet; service-role for API routes
- **Vercel** — production host, Hobby plan, Git push to `main` auto-deploys
- **Stripe** — Checkout (design fee); monthly hosting via subscription + 30-day trial; lifetime $2,996 on day 31
- **Resend** — transactional email (`RESEND_API_KEY`)

---

## File layout

```
app/
├── api/leads/route.ts
├── api/contact/route.ts
├── api/stripe/webhook/route.ts
├── api/cron/ten-year-hosting/route.ts
├── api/admin/env-status/route.ts
├── api/admin/migrate-hosting-billing/route.ts
├── globals.css
├── layout.tsx
├── page.tsx
├── opengraph-image.tsx
├── robots.ts
├── sitemap.ts
├── thanks/page.tsx
└── legal/{terms,privacy}/
components/
├── Nav.tsx, Footer.tsx, Hero.tsx, Carousel.tsx
├── ValueProps.tsx, HowItWorks.tsx, Pricing.tsx, FAQ.tsx, LeadForm.tsx
├── ContactModal.tsx, ThemeToggle.tsx
data/
├── portfolio.ts
└── faq.ts
lib/
├── supabase.ts, stripe.ts, products.ts, version.ts
├── hosting-policy.ts, checkout-session.ts, ten-year-hosting-billing.ts
├── validate-lead.ts, lead-email.ts, internal-lead-email.ts, crm-notify.ts
├── supabase-health.ts, production-config.ts, stripe-ops-check.ts
proxy.ts
public/portfolio/
scripts/
├── apply-hosting-billing-migration.mjs
└── create-live-checkout-smoke.mjs
```

---

## Env vars (.env.local — gitignored)

| Key | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes (leads, CRM, rate limits) |
| `STRIPE_SECRET_KEY` | Checkout + webhook |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` |
| `RESEND_API_KEY` | Contact + lead + internal alert emails |
| `BALANCE_CAPTURE_SECRET` | Admin bearer (`env-status`, migrate routes, cron fallback) |
| `CRM_ADMIN_SECRET` | `/crm` login (required in production; do not reuse balance secret) |
| `CRON_SECRET` | Optional — `/api/cron/ten-year-hosting` (falls back to balance secret) |
| `POSTGRES_URL_NON_POOLING` / `POSTGRES_HOST` + `POSTGRES_PASSWORD` | Vercel Postgres integration — server-side DDL migrations |

Set the same keys in Vercel → Project Settings → Environment Variables.

---

## Supabase schema

Canonical SQL: **`supabase/schema.sql`**. Incremental migrations in **`supabase/migrations/`**. Run in helmet SQL editor or via admin migrate POST routes / `scripts/apply-*.mjs`. Service-role API routes bypass RLS.

Key migrations:
- `20260602120000_wd_leads_stripe_subscription.sql` — `stripe_subscription_id`
- `20260605140000_processed_stripe_events.sql` — webhook idempotency
- `20260605180000_wd_leads_hosting_billing.sql` — lifetime day-31 billing columns

---

## Local dev (multi-Cursor Windows)

**Pinned:** http://localhost:3000 · Full practices: **`DEV.md`** · Cursor rule: `.cursor/rules/multi-cursor-local-dev.mdc`

## Stripe

**`STRIPE-SETUP.md`** — test vs live, Vercel vars, Dashboard webhook, local CLI, env-status check. **`DEPLOYMENT.md`** — production go-live checklist.

---

## How to ship a change

```
cd repos/998webdesigns-com-site
git checkout -b fix/<name>   # or polish/feat — preview on Vercel branch deploy
npm run dev   # http://localhost:3000 (pinned in package.json)
npm run build
git commit -m "v32.x: description"   # ASCII-only
git push -u origin fix/<name>
# review preview, merge to main for production
```

Rules:
- Bump `SITE_VERSION` in `lib/version.ts` on every deploy-visible change.
- **Pricing copy** in `Pricing.tsx` — product; no edits without approval.
- Merge to `main` deploys https://998webdesigns.com (~30–60s).

---

## Recovery

```bash
cd C:\Users\thede\OneDrive\Documents\Claude\slatepress\repos
git clone https://github.com/bearllc555-spec/998webdesigns-com-site
cd 998webdesigns-com-site
npm install
# .env.local from workspace .local/ Supabase + Stripe + Resend keys
npm run dev
```

---

## Session log

| Date | Event |
|---|---|
| 2026-05-21 | v0.1 scaffold (Next.js + Supabase + home + leads stub). |
| 2026-06 | Vercel production, Stripe Checkout, Resend, legal, SEO, rate limits, CRM, vitest. |
| 2026-06-02 | Hosting policy shipped: 30-day free trial, monthly $198/mo, lifetime $2,996 day-31 cron, lifetime paid alerts, FAQ hosting limits + promo cleanup, env-status hosting column probe, ops 1–5 documented (E2E blocked on bank). |
| 2026-06-02 | v32.94–95: `/portfolio`, `/pricing`, `/start` standalone routes + sitemap; Lighthouse/security QA pass (HSTS, CSP, admin 401, robots/sitemap); a11y contrast + heading-order fixes on add-ons + version pill. |
| 2026-06-02 | Live checkout E2E verified (ops #3): $1 smoke paid end-to-end; smoke script launcher fix (`1dbec4c`). |
| 2026-06-02 | v32.96: Stripe Customer Portal — `/hosting/manage` magic-link flow + FAQ entry; `scripts/configure-stripe-billing-portal.mjs`. |
