# 998webdesigns-com-site — Project Handoff

Read at the start of every session that touches this repo. Stack, env, file layout, deploy flow, and what is wired vs deferred.

---

## Status (production — 2026-06)

**Live on Vercel** at https://998webdesigns.com — project **`998webdesigns-com-site`** only. GitHub `bearllc555-spec/998webdesigns-com-site`. Site version label in nav/footer (`lib/version.ts`, currently v27.x).

Pricing copy in `components/Pricing.tsx` is from the locked product brief. **Do not change pricing wording without explicit approval — the pricing language is the product.**

---

## What ships today

- Home (`/`) — Hero, add-ons, portfolio carousel, value props, how it works, pricing, FAQ, 4-step lead form, footer. Light/dark theme toggle.
- `/thanks` — post-payment timeline; requires paid Stripe `session_id` (no spoofing via query string).
- `/legal/terms`, `/legal/privacy` — operator-drafted legal copy aligned to Stripe + lead form flow.
- `/api/leads` — POST: honeypot, full server validation (`lib/validate-lead.ts`), Supabase `wd_leads` insert (graceful if table missing), Stripe Checkout (`customer_creation: always`), Resend checkout-link email, webhook balance auth hold on deposit.
- `/api/contact` — POST: honeypot, Resend to hello@998webdesigns.com.
- `/api/stripe/webhook` — signed webhook; $499 balance auth hold on deposit; updates `wd_leads` status; Resend alerts on submit + payment.
- `/api/admin/capture-balance` — POST with `BALANCE_CAPTURE_SECRET` captures deposit balance (`lib/capture-balance.ts`).
- **Checkout origins** — `lib/checkout-origin.ts` allowlist (no open redirect via `Origin`).
- **Stripe go-live** — `DEPLOYMENT.md` + `lib/stripe-env.ts` warns if Production still uses `sk_test_`.
- SEO — `robots.txt`, `sitemap.xml`, `index, follow` on marketing pages; `/thanks` noindex.
- OG image — `app/opengraph-image.tsx`.
- Rate limiting — `proxy.ts` (in-memory) + Supabase `api_rate_limits` on API routes when tables exist (`lib/api-rate-limit.ts`).
- Analytics — `@vercel/analytics` in root layout.

---

## Deferred / backlog

- **Portfolio carousel** — Serenity Spa is live-linked; other slots use placeholder art until real mockups + URLs ship (`data/portfolio.ts`).
- **Slack** — optional; payment alerts already email `hello@` via Resend on webhook.
- **$98/mo hosting subscription** — Stripe Subscription not built.
- **Standalone `/portfolio`, `/pricing`, `/start`** — anchors on home only.
- **SendGrid** — not used; transactional email is **Resend**.
- **Supabase tables** — run `supabase/schema.sql` once if `wd_leads` / `api_rate_limits` are missing.
- **Lighthouse / security review** — manual pass still recommended.
- **Lawyer review** — Terms/Privacy are operator-drafted.

---

## Quick links

| Surface | URL |
|---|---|
| Repo | https://github.com/bearllc555-spec/998webdesigns-com-site |
| Production | https://998webdesigns.com |
| Vercel project | `bearllc555-6551s-projects/998webdesigns-com-site` |
| Supabase | https://supabase.com/dashboard/project/jxthwtflrzudepxysgje |

---

## Stack

- **Next.js 16** — App Router, TypeScript, `app/` at repo root (no `src/`), Tailwind CSS v4 (`app/globals.css` @theme)
- **Fonts** — Inter (body) + Geist (display via `font-display`)
- **Supabase** — Postgres; service-role inserts for leads
- **Vercel** — production host, Hobby plan, Git push to `main` auto-deploys
- **Stripe** — Checkout (deposit $499 / full $998); webhook for balance hold
- **Resend** — contact form + lead checkout-link email (`RESEND_API_KEY`)

---

## File layout

```
app/
├── api/leads/route.ts
├── api/contact/route.ts
├── api/stripe/webhook/route.ts
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
| `BALANCE_CAPTURE_SECRET` | `/api/admin/capture-balance` |

Set the same keys in Vercel → Project Settings → Environment Variables.

---

## Supabase schema

Canonical SQL: **`supabase/schema.sql`** (`wd_leads` + `api_rate_limits`). Run in Supabase SQL editor for project `jxthwtflrzudepxysgje`. Service-role API routes bypass RLS.

---

## How to ship a change

```
cd repos/998webdesigns-com-site
git checkout -b fix/<name>   # or polish/feat — preview on Vercel branch deploy
npm run dev
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
