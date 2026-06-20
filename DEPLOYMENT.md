# Deployment - 998webdesigns.com

## Vercel project (only one)

| | |
|---|---|
| **Project** | `998webdesigns-com-site` |
| **Production URL** | https://998webdesigns.com |
| **GitHub** | `bearllc555-spec/998webdesigns-com-site` - push `main` auto-deploys |

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
| `RESEND_API_KEY` | Contact form + lead emails + internal lead/payment alerts (From: `hello@998webdesigns.com` via `lib/transactional-email.ts`) |
| `BALANCE_CAPTURE_SECRET` | Bearer token for `GET /api/admin/env-status` and admin migrate routes |
| `CRM_ADMIN_SECRET` | **Required in Production** - `/crm` login and `/api/crm/*` (do not reuse `BALANCE_CAPTURE_SECRET`) |
| `STRIPE_EXPECTED_MODE` | Optional `test` or `live` - must match `STRIPE_SECRET_KEY` prefix |
| `NEXT_PUBLIC_SUPABASE_URL` | Lead storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (if used client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | `wd_leads` inserts |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | `/api/calendly/webhook` signature verification (from Calendly webhook subscription) |
| `TWILIO_ACCOUNT_SID` | Discovery SMS verify + CRM SMS |

**Discovery Calendly:** Production should **not** set `NEXT_PUBLIC_BOOK_CALL_URL`. `/book/schedule?token=…` embeds the canonical event in `lib/book-call.ts`: [998webdesigns/discovery-call-998-web-designs](https://calendly.com/998webdesigns/discovery-call-998-web-designs). If already booked, the same link shows a confirmation page.

**Calendly webhook (required for email-link confirmation after booking):**

1. Run migration `supabase/migrations/20260620120000_discovery_calendly_booking.sql` on helmet (adds `calendly_event_start_at`, `calendly_invitee_uri`).
2. Calendly → Integrations → Webhooks → create subscription:
   - URL: `https://998webdesigns.com/api/calendly/webhook`
   - Events: `invitee.created`, `invitee.canceled`
   - Scope: organization or user that owns the discovery event
3. Copy the **signing key** into Vercel as `CALENDLY_WEBHOOK_SIGNING_KEY` and redeploy.

Prospects are matched via `utm_campaign=<prospect uuid>` on the Calendly URL (set automatically) with email fallback.

If env-status warns about a mismatched `NEXT_PUBLIC_BOOK_CALL_URL`, delete the var on Vercel Production and redeploy.

Secrets live in workspace `.local/` (gitignored). Never commit keys.

## Stripe: test vs live

**Production today:** Live mode (`sk_live_...`), `STRIPE_EXPECTED_MODE=live`, Bear LLC Payments account.

**Sandbox (optional):** Use `sk_test_...` on a Preview deploy or locally with `STRIPE_EXPECTED_MODE=test`. Card `4242 4242 4242 4242` in Stripe Sandbox.

**Go-live checklist (already done on prod unless you rotate keys):**

1. Stripe Dashboard → **Live** mode → Developers → API keys → `sk_live_...`.
2. Webhooks → endpoint `https://998webdesigns.com/api/stripe/webhook` with events below → copy **live** `whsec_...`.
3. Vercel Production → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, redeploy.
4. `GET /api/admin/env-status` → `readyForLiveCharges: true`, `warnings: []`.
5. One completed live Checkout (optional proof) - **blocked until bank approves a real-card test**; see workspace `whats-next.md` item 13.

Server logs warn when Production still has `sk_test_` (`lib/stripe-env.ts`).

## Verify production wiring (no secrets in response)

```bash
curl -s https://998webdesigns.com/api/admin/env-status \
  -H "Authorization: Bearer YOUR_BALANCE_CAPTURE_SECRET"
```

Returns JSON: Stripe mode (`test`/`live`), which env vars are set, `warnings[]`, and `readyForLiveCharges`. Use after every key rotation or before accepting real cards.

## Stripe webhook

- URL: `https://998webdesigns.com/api/stripe/webhook`
- **Checkout (required):**
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded` (ACH settled)
  - `checkout.session.async_payment_failed` (ACH failed → hello@ alert)
- **Month-to-month hosting (recommended when billing $98/mo):**
  - `invoice.payment_failed` → hello@ + lead status `hosting_payment_failed`
  - `customer.subscription.deleted` → hello@ + lead status `hosting_canceled`

All new checkouts use the **50 / 40 / 10 design fee schedule** ($5,998 total - 50% deposit at Checkout, 40% and 10% invoiced from CRM at milestones). Promo codes in `lib/design-promo-codes.ts` (e.g. **LINKEDIN20** = 20% off design fee only).

**Legacy:** Older pay-in-full Stripe sessions still complete the webhook and sync as `paid_in_full`.

`GET /api/admin/env-status` probes ACH + subscribed webhook events when `sk_live_` is set.

## Internal lead alerts (Resend)

All transactional mail uses **From:** `998 web designs <hello@998webdesigns.com>` (`lib/transactional-email.ts`). Verify `hello@998webdesigns.com` is an allowed sender in Resend for domain `998webdesigns.com`.

| When | Email to `hello@998webdesigns.com` |
|------|-------------------------------------|
| Form submitted, Checkout link created | **New lead - awaiting payment** (checkout URL + session link) |
| Checkout completed (card or ACH settled) | **Paid in full** (amount + Stripe session link) |
| Lifetime hosting Checkout completed (day 31) | **Lifetime hosting paid** (amount + Stripe session link) |
| ACH failed after Checkout | **ACH payment failed** |
| $98/mo renewal failed | **Hosting renewal failed** |
| Subscription canceled | **Hosting subscription ended** |

Uses `RESEND_API_KEY`.

## Checkout line items

Stripe Checkout charges (separate sessions by payment channel):

- Design: **$5,998 pay-in-full** (required; promo codes in `lib/design-promo-codes.ts`)
- **Lifetime hosting:** $2,996 on day 31 (not at signup)
- **Card only:** +3% processing on the design fee at initial Checkout
- **Bank (ACH):** list price; settlement async - webhook `checkout.session.async_payment_succeeded` marks paid
- **Month-to-month hosting:** $98/mo after a 30-day free trial (subscription Checkout at signup; design fee only today). Run `supabase/migrations/20260602120000_wd_leads_stripe_subscription.sql` on helmet if `stripe_subscription_id` column is missing.
- **Lifetime hosting:** $2,996 on day 31 via automated cron (`/api/cron/ten-year-hosting`, daily 14:00 UTC). Run `supabase/migrations/20260605180000_wd_leads_hosting_billing.sql` for `hosting_billing_starts_at` columns. Cron auth: `Authorization: Bearer` with `CRON_SECRET` or `BALANCE_CAPTURE_SECRET`.
- **Sales tax:** not collected (no Stripe Tax)

**Hero add-ons (lead form):** Google Profile Optimization, blogging strategies, hyper-local SEO, etc. are **scope flags only** - they do not add Stripe line items or change the checkout amount. Ops uses them when scoping the build.

**Stripe Dashboard (required for ACH):** Enable ACH Direct Debit; subscribe all webhook events in the section above. See `STRIPE-SETUP.md`.

## SEO (sitemap / robots)

Indexable routes live in `lib/sitemap-config.ts`. `/thanks` and `/api/*` are excluded from the sitemap and blocked in `robots.txt`. Bump `SITEMAP_LAST_MODIFIED` in that file when home or legal pages change materially.

## Supabase (correct project)

Production must use **`supabase-998webdesigns-helmet`** (org **bearllc555-6551's projects**). Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from that project's API settings. Helper: `slatepress/GO-FIX-SUPABASE-998-HELMET.ps1` (reads `.local/supabase-helmet-*.txt`, `supabase-project-*.txt`, or `supabase-998-helmet-notes.txt`). Do not use deleted `jxth...` or stale `xyfhj...` integration leftovers.

Re-apply from workspace: `GO-FIX-SUPABASE-998.ps1` or ask Cursor to fix Supabase on Vercel.

## Supabase + GitHub

**Day-to-day:** Vercel ↔ helmet integration is enough (env vars + live tables). No dashboard GitHub form required.

**Optional:** Supabase Integrations → GitHub → repo `998webdesigns-com-site`, working directory `.`, **Deploy to production** ON. Or ignore - Cursor can run SQL in the editor when schema changes.

**Optional auto-migrations:** `.github/workflows/supabase-migrations.yml` + `slatepress/GO-FINISH-SUPABASE-GITHUB-998.cmd` (sets GitHub secrets; may prompt once for a Supabase access token).

## Supabase tables

- **`wd_leads`** - Get started (`/api/leads`)
- **`contact_submissions`** - Contact modal (`/api/contact`)
- **`api_rate_limits`** - distributed API rate limits

Apply via GitHub push (migrations) or run **`supabase/schema.sql`** once in the SQL editor.

**Webhook idempotency:** `processed_stripe_events` - migration `supabase/migrations/20260605140000_processed_stripe_events.sql`. `env-status` warns if missing; webhook still works but duplicate Stripe retries may re-send emails until the table exists.

If tables are missing, leads still reach Stripe; contact email still sends; logs note missing tables.

## Rate limiting

1. **Edge** (`proxy.ts`) - in-memory burst protection per isolate.
2. **API routes** - Postgres counters in `api_rate_limits` when Supabase is configured (global across regions).

## Checkout return URLs

`/api/leads` uses `lib/checkout-origin.ts` - allowlisted origins only; no open redirect via `Origin`.

## CRM + Telegram (`/crm`)

Private mini-CRM at **https://998webdesigns.com/crm** (also works after you add subdomain - see below).

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Optional fallback - prefer configuring in CRM |
| `TELEGRAM_CHAT_ID` | Optional fallback (comma-separated chat ids) |
| `TELEGRAM_CHAT_IDS` | Optional extra env chat ids |
| `TELEGRAM_CHAT_LABELS` | Optional env labels |
| `CRM_ADMIN_SECRET` | Sign-in password for `/crm` (**required in production** - no fallback to `BALANCE_CAPTURE_SECRET`) |

**Telegram (recommended):** configure at **https://998webdesigns.com/crm/telegram** - bot token, chat ids, labels saved to Supabase table `crm_telegram_settings`. Use **Discover recent chats** after messaging your bot, then **Save** and **Send test alert**. Env vars apply only until CRM settings are saved.

**Schema:** `crm_telegram_settings` is in `supabase/schema.sql` / migration `20260602180000_crm_telegram_settings.sql`. One-time apply on production:

```bash
curl -X POST https://998webdesigns.com/api/admin/migrate-crm-telegram \
  -H "Authorization: Bearer YOUR_BALANCE_CAPTURE_SECRET"
```

Returns `{"ok":true,"via":"..."}` when the table exists. Also runnable via `node scripts/apply-crm-telegram-from-env.mjs .env.vercel.prod` if local Postgres creds work.

**Telegram alerts** fire on: lead form submit, checkout link created, paid, ACH pending/failed, hosting renewal fail/cancel, contact form. Each event is sent to **all** configured chat ids in parallel.

**Sign in:** https://998webdesigns.com/crm/login - use `CRM_ADMIN_SECRET` in production. `GET /api/admin/env-status` still uses `BALANCE_CAPTURE_SECRET` for ops checks.

**Subdomain (optional):** In Vercel → **998webdesigns-com-site** → Settings → Domains → add `crm.998webdesigns.com` to the same project. In Cloudflare DNS, `CNAME crm` → `cname.vercel-dns.com`. The app route stays `/crm`; for root-on-subdomain you would add a redirect rule later.

`robots.txt` disallows `/crm`. Not in the public sitemap.
