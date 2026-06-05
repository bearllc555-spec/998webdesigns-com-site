# 998webdesigns-com-site — Project Handoff

Read at the start of every session that touches this repo. Stack, env, file layout, deploy flow, and what is wired vs deferred.

---

## Status (production — 2026-06)

**Live on Vercel** at https://998webdesigns.com — project **`998webdesigns-com-site`** only. GitHub `bearllc555-spec/998webdesigns-com-site`. Site version label in nav/footer (`lib/version.ts`, currently v32.x).

Pricing copy in `components/Pricing.tsx` is from the locked product brief. **Do not change pricing wording without explicit approval — the pricing language is the product.**

---

## What ships today

- Home (`/`) — Hero, add-ons, portfolio carousel, value props, how it works, pricing, FAQ, 5-step lead form, footer. Light/dark theme toggle.
- `/thanks` — post-payment timeline; requires paid Stripe `session_id` (no spoofing via query string).
- `/legal/terms`, `/legal/privacy` — operator-drafted legal copy aligned to Stripe + lead form flow.
- `/api/leads` — POST: honeypot, full server validation (`lib/validate-lead.ts`), Supabase `wd_leads` insert (graceful if table missing), Stripe Checkout ($5,998 pay-in-full; promo codes in `lib/design-promo-codes.ts`), Resend checkout-link email.
- `/api/contact` — POST: honeypot, Supabase `contact_submissions` insert, Resend to hello@998webdesigns.com.
- `/api/stripe/webhook` — signed webhook; `checkout.session.completed` syncs `paid_in_full` + internal payment email.
- `/api/admin/env-status` — GET with `BALANCE_CAPTURE_SECRET` bearer; production wiring snapshot.
- **Checkout origins** — `lib/checkout-origin.ts` allowlist (no open redirect via `Origin`).
- **Stripe go-live** — `DEPLOYMENT.md` + `lib/stripe-env.ts` warns if Production still uses `sk_test_`.
- SEO — `robots.txt`, `sitemap.xml`, `index, follow` on marketing pages; `/thanks` noindex.
- OG image — `app/opengraph-image.tsx`.
- Rate limiting — `proxy.ts` (in-memory) + Supabase `api_rate_limits` on API routes when tables exist (`lib/api-rate-limit.ts`).
- Analytics — `@vercel/analytics` in root layout.
- **CRM** — `/crm` (auth: `CRM_ADMIN_SECRET` required in production; no `BALANCE_CAPTURE_SECRET` fallback), feed from `wd_leads` + `contact_submissions`, `/crm/telegram` configures bot token + chat ids (Supabase `crm_telegram_settings`; env vars are fallback). CRM version: `lib/crm-version.ts` — bump on every CRM change.
- **Webhook idempotency** — `processed_stripe_events` table + `lib/stripe-webhook-idempotency.ts`.

---

## Deferred / backlog

- **Live checkout E2E (audit #5)** — blocked until bank approves a real-card test charge. Live Stripe + webhook + ACH verified via env-status; paid Checkout → webhook delivery 200 not yet proven. When approved: `node scripts/create-live-checkout-smoke.mjs` ($1), confirm Stripe Event deliveries → 200, refund. On portfolio queue: `whats-next.md` item 13.
- **Portfolio carousel** — Serenity Spa is live-linked; other slots use placeholder art until real mockups + URLs ship (`data/portfolio.ts`).
- **Slack** — optional; payment alerts already email `hello@` via Resend on webhook.
- **Stripe Billing Portal** — optional self-serve cancel for $198/mo (subscription id stored on `wd_leads`).
- **Standalone `/portfolio`, `/pricing`, `/start`** — anchors on home only.
- **SendGrid** — not used; transactional email is **Resend**.
- **Supabase tables** — run `supabase/schema.sql` once if `wd_leads` / `api_rate_limits` / `contact_submissions` are missing; or `supabase/contact-submissions.sql` if only contact table is new.
- **Lighthouse / security review** — manual pass still recommended.
- **Lawyer review** — Terms/Privacy are operator-drafted.

---

## Quick links

| Surface | URL |
|---|---|
| Repo | https://github.com/bearllc555-spec/998webdesigns-com-site |
| Production | https://998webdesigns.com |
| Vercel project | `bearllc555-6551s-projects/998webdesigns-com-site` |
| Supabase | **supabase-998webdesigns-helmet** (Vercel org bearllc555-6551's projects) |

---

## Stack

- **Next.js 16** — App Router, TypeScript, `app/` at repo root (no `src/`), Tailwind CSS v4 (`app/globals.css` @theme)
- **Fonts** — Inter (body) + Geist (display via `font-display`)
- **Supabase** — Postgres; service-role inserts for leads
- **Vercel** — production host, Hobby plan, Git push to `main` auto-deploys
- **Stripe** — Checkout ($5,998 pay-in-full; lifetime hosting $2,996 on day 31; `lib/design-promo-codes.ts`)
- **Resend** — contact form + lead checkout-link email (`RESEND_API_KEY`)

---

## File layout

```
app/
├── api/leads/route.ts
├── api/contact/route.ts
├── api/stripe/webhook/route.ts
├── api/admin/env-status/route.ts
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
├── validate-lead.ts, lead-email.ts, rate-limit.ts
proxy.ts
public/portfolio/
```

---

## Env vars (.env.local — gitignored)

| Key | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/leads` insert |
| `STRIPE_SECRET_KEY` | Checkout + webhook |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` |
| `RESEND_API_KEY` | `/api/contact`, `/api/leads` email |
| `BALANCE_CAPTURE_SECRET` | `/api/admin/env-status` |

Set the same keys in Vercel → Project Settings → Environment Variables.

---

## Supabase schema

Canonical SQL: **`supabase/schema.sql`** (`wd_leads` + `api_rate_limits`). Run once in **helmet** SQL editor. Service-role API routes bypass RLS.

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
git commit -m "v27.x: description"   # ASCII-only
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
| 2026-06 | Vercel production, Stripe Checkout, Resend, legal, SEO, rate limits, v27.x audit fixes, vitest. |
