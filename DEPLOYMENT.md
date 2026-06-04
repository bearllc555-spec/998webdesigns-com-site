# Deployment — 998webdesigns.com

## Vercel project (only one)

| | |
|---|---|
| **Project** | `998webdesigns-com-site` |
| **Production URL** | https://998webdesigns.com |
| **GitHub** | `bearllc555-spec/998webdesigns-com-site` — push `main` auto-deploys |

Link the repo with:

```bash
npx vercel link --project 998webdesigns-com-site
```

## Environment variables (Production)

Set on **998webdesigns-com-site** in Vercel → Settings → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Checkout + webhook |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` |
| `RESEND_API_KEY` | Contact form + lead emails + internal lead/payment alerts |
| `BALANCE_CAPTURE_SECRET` | Bearer token for `GET /api/admin/env-status` |
| `STRIPE_EXPECTED_MODE` | Optional `test` or `live` — must match `STRIPE_SECRET_KEY` prefix |
| `NEXT_PUBLIC_SUPABASE_URL` | Lead storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (if used client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | `wd_leads` inserts |

Secrets live in workspace `.local/` (gitignored). Never commit keys.

## Stripe: test vs live

**Current intent:** Production may run `sk_test_...` while you test with card `4242 4242 4242 4242` in Stripe Sandbox.

**Before accepting real money:**

1. Stripe Dashboard → turn off Sandbox / use **Live** mode.
2. Developers → API keys → copy **live** secret (`sk_live_...`).
3. Developers → Webhooks → add endpoint `https://998webdesigns.com/api/stripe/webhook`, event `checkout.session.completed`, copy **live** signing secret (`whsec_...`).
4. Vercel → **998webdesigns-com-site** → Production → update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
5. Redeploy Production.
6. Run one real small-charge test, then refund in Stripe if needed.

Server logs warn when Production still has `sk_test_` (`lib/stripe-env.ts`). While sandbox testing, set `STRIPE_EXPECTED_MODE=test` on Production so env-status does not flag a false mismatch.

## Verify production wiring (no secrets in response)

```bash
curl -s https://998webdesigns.com/api/admin/env-status \
  -H "Authorization: Bearer YOUR_BALANCE_CAPTURE_SECRET"
```

Returns JSON: Stripe mode (`test`/`live`), which env vars are set, `warnings[]`, and `readyForLiveCharges`. Use after every key rotation or before accepting real cards.

## Stripe webhook

- URL: `https://998webdesigns.com/api/stripe/webhook`
- Event: `checkout.session.completed` (required)
- All new checkouts are **$1,998 pay-in-full** (plus optional ten-year hosting). No deposit or balance-hold flow.

**Legacy:** Old deposit checkouts in Stripe still complete the webhook and sync as `paid_in_full`. Any open balance holds from before this change must be captured or released in the [Stripe Dashboard](https://dashboard.stripe.com) manually.

## Internal lead alerts (Resend)

| When | Email to `hello@998webdesigns.com` |
|------|-------------------------------------|
| Form submitted, Checkout link created | **New lead — awaiting payment** (checkout URL + session link) |
| Checkout completed | **Paid in full** (amount + Stripe session link) |

Uses `RESEND_API_KEY`.

## Checkout line items

Stripe Checkout charges:

- Design: **$1,998 pay-in-full** (required)
- **Ten-year hosting:** +$1,349 when lead selects ten-year hosting on the form
- **Month-to-month hosting:** not in Checkout yet ($198/mo billed after launch — metadata + emails only)

## SEO (sitemap / robots)

Indexable routes live in `lib/sitemap-config.ts`. `/thanks` and `/api/*` are excluded from the sitemap and blocked in `robots.txt`. Bump `SITEMAP_LAST_MODIFIED` in that file when home or legal pages change materially.

## Supabase (correct project)

Production must use **`supabase-998webdesigns-helmet`** (org **bearllc555-6551's projects**). Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from that project's API settings. Helper: `slatepress/GO-FIX-SUPABASE-998-HELMET.ps1` (reads `.local/supabase-helmet-*.txt`, `supabase-project-*.txt`, or `supabase-998-helmet-notes.txt`). Do not use deleted `jxth...` or stale `xyfhj...` integration leftovers.

Re-apply from workspace: `GO-FIX-SUPABASE-998.ps1` or ask Cursor to fix Supabase on Vercel.

## Supabase + GitHub

Repo is set up for [Supabase GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration): `supabase/config.toml` + `supabase/migrations/`.

**One-time (Anthony):** double-click `slatepress/GO-LINK-SUPABASE-GITHUB-998.cmd` → authorize GitHub → connect repo `bearllc555-spec/998webdesigns-com-site` → production branch `main` → enable **Deploy to production**. Details: `supabase/README.md`.

**Baseline repair (once, after connect):** helmet already has tables — run `npx supabase migration repair --status applied 20260604140000` after `supabase link --project-ref xwldbxburzqryxlzocck` so history matches live DB.

## Supabase tables

- **`wd_leads`** — Get started (`/api/leads`)
- **`contact_submissions`** — Contact modal (`/api/contact`)
- **`api_rate_limits`** — distributed API rate limits

Apply via GitHub push (migrations) or run **`supabase/schema.sql`** once in the SQL editor.

If tables are missing, leads still reach Stripe; contact email still sends; logs note missing tables.

## Rate limiting

1. **Edge** (`proxy.ts`) — in-memory burst protection per isolate.
2. **API routes** — Postgres counters in `api_rate_limits` when Supabase is configured (global across regions).

## Checkout return URLs

`/api/leads` uses `lib/checkout-origin.ts` — allowlisted origins only; no open redirect via `Origin`.
