# Deployment - 998webdesigns.com

## Production host (Cloudflare Workers)

| | |
|---|---|
| **URL** | https://998webdesigns.com |
| **Worker** | `998webdesigns-com-site` (`wrangler.jsonc`) |
| **Deploy** | Push `main` → GitHub Actions `.github/workflows/deploy-cloudflare.yml` (~1–2 min) |
| **Crons** | GitHub Actions `.github/workflows/cf-cron.yml` (GET + bearer; secrets `CRON_SECRET` / `CRON_TARGET_URL`) |
| **CF account** | `e0f6f68f26f8a26a75eaa793385019ef` |

Local dev unchanged: `npm run dev` on http://localhost:3000.

---

## Dev host (Cloudflare Workers)

| | |
|---|---|
| **URL** | https://dev.998webdesigns.com |
| **Worker** | `998webdesigns-com-site-dev` (`wrangler.jsonc` → `env.dev`) |
| **Deploy** | Same push to `main` as production (second step in `deploy-cloudflare.yml`) |
| **Env** | `APP_ENV=preview`, `NEXT_PUBLIC_SITE_URL=https://dev.998webdesigns.com` |
| **SEO** | `X-Robots-Tag: noindex, nofollow` on all dev responses |
| **Data** | Same helmet Supabase + Stripe keys as prod (shared backend — treat checkout on dev as real) |

**First-time / after new secret keys:** sync secrets to both workers from this machine:

```bash
npm run cf:sync-secrets:all
# or individually:
npm run cf:sync-secrets        # production
npm run cf:sync-secrets:dev    # dev
```

**Manual deploy (local):**

```bash
npm run cf:deploy:all          # prod + dev
npm run cf:deploy:dev          # dev only (after cf:build)
```

**Ops checklist on dev:**

```bash
BALANCE_CAPTURE_SECRET=... node scripts/cf-ops-checklist.mjs https://dev.998webdesigns.com
```

Crons stay on production apex only (`cf-cron.yml` → `https://998webdesigns.com`).

---

Production and dev workers use the same secret set (see **Dev host** above). Upload via `npm run cf:sync-secrets:all` or Wrangler dashboard. Keys: Supabase, Stripe, Resend, Twilio, Calendly, CRM, `GEMINI_API_KEY`, Telegram, etc. See `.env.example` and `scripts/sync-cf-worker-secrets.mjs` `FILE_OVERRIDES`.

Optional: `NEXT_PUBLIC_CF_BEACON_TOKEN` (Cloudflare Web Analytics). **Do not set** `NEXT_PUBLIC_BOOK_CALL_URL` on production.

### GitHub secrets (repo Settings → Secrets)

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Workers deploy — **Account → Workers Scripts → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | `e0f6f68f26f8a26a75eaa793385019ef` |
| `CRON_SECRET` | Bearer for `cf-cron.yml` (fallback: `BALANCE_CAPTURE_SECRET`) |
| `CRON_TARGET_URL` | Optional — defaults to `https://998webdesigns.com` |

### Ops checklist

```bash
BALANCE_CAPTURE_SECRET=... node scripts/cf-ops-checklist.mjs https://998webdesigns.com
curl -s https://998webdesigns.com/api/admin/env-status \
  -H "Authorization: Bearer $BALANCE_CAPTURE_SECRET"
```

---

## Vercel (decommissioned 2026-06-30)

| | |
|---|---|
| **Project** | `998webdesigns-com-site` (archived — manual rollback only) |
| **Dashboard** | https://vercel.com/bearllc555-6551s-projects/998webdesigns-com-site |
| **Status** | GitHub auto-deploy **disconnected** (`vercel git disconnect`) |
| **Crons** | Removed from `vercel.json` — use `cf-cron.yml` only |

Legacy CLI link:

```bash
npx vercel link --project 998webdesigns-com-site
```

---

## Emergency rollback to Vercel

Use only when **Cloudflare Workers production is broken** (checkout down, 5xx on apex, bad deploy) and you need traffic on Vercel again. Webhook URLs stay `https://998webdesigns.com/api/...` — no Stripe/Calendly/Twilio reconfiguration if apex DNS moves to Vercel.

**Time budget:** ~15–30 minutes. Keep CF Worker in place until Vercel is verified.

### When to roll back vs fix forward

| Situation | Action |
|-----------|--------|
| Bad code on `main` | **Fix forward** — revert commit on GitHub, let `deploy-cloudflare.yml` redeploy (~1–2 min) |
| CF/OpenNext runtime bug, env secret typo on Worker only | **Fix forward** — patch Worker secrets or hotfix branch |
| Apex unreachable, Worker deploy loop broken, unknown platform outage | **Rollback** — steps below |
| Local dev broken | Not a rollback case — fix locally |

### Prerequisites (have ready before DNS flip)

- [ ] Vercel project still exists: `998webdesigns-com-site`
- [ ] Production env vars on Vercel match Worker (or copy from `slatepress/.local/` via `scripts/sync-cf-worker-secrets.mjs` mapping + manual paste in Vercel dashboard)
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRM_ADMIN_SECRET`, `BALANCE_CAPTURE_SECRET` at minimum
- [ ] Optional: pause pushes to `main` (GitHub → Actions → disable **Deploy Cloudflare**) so a CF deploy does not fight DNS during rollback

### Step 1 — Redeploy Vercel (before or in parallel with DNS)

**Option A — CLI (fastest if env vars already on Vercel):**

```bash
cd repos/998webdesigns-com-site
npx vercel link --project 998webdesigns-com-site --yes
npx vercel deploy --prod
```

Note the deployment URL (e.g. `998webdesigns-com-site-….vercel.app`). Hit `/api/admin/env-status` on that URL with `BALANCE_CAPTURE_SECRET` before cutting DNS.

**Option B — Reconnect GitHub auto-deploy:**

1. Vercel → **998webdesigns-com-site** → Settings → **Git** → **Connect Git Repository** → `bearllc555-spec/998webdesigns-com-site`, branch `main`.
2. Copy all Production env vars from Cloudflare Worker dashboard (or `.local/`) into Vercel → Settings → Environment Variables → **Production**.
3. Deployments → **Redeploy** latest Production, or push an empty commit to `main`.

**Env var sync:** Vercel dashboard: https://vercel.com/bearllc555-6551s-projects/998webdesigns-com-site/settings/environment-variables

Do **not** set `NEXT_PUBLIC_BOOK_CALL_URL` on Production (same rule as Worker).

### Step 2 — Verify Vercel before DNS

```bash
# Replace HOST with *.vercel.app deployment URL until DNS is flipped
curl -s "https://YOUR-DEPLOYMENT.vercel.app/api/admin/env-status" \
  -H "Authorization: Bearer YOUR_BALANCE_CAPTURE_SECRET"
```

Expect: `readyForLiveCharges: true`, `warnings: []`, `hostPlatform` reflecting Vercel/Node (not `cloudflare-workers`).

Smoke: open deployment URL → confirm lead form loads, `/crm/login` responds, version label visible.

### Step 3 — Point DNS from Worker to Vercel

Zone is on **Cloudflare** (account `e0f6f68f26f8a26a75eaa793385019ef`).

1. **Remove Worker custom domains** (stops apex/www routing to OpenNext):
   - Cloudflare dashboard → **Workers & Pages** → `998webdesigns-com-site` → **Settings** → **Domains and routes**
   - Remove `998webdesigns.com` and `www.998webdesigns.com` custom domains  
   - Or temporarily delete the `routes` block in `wrangler.jsonc` and deploy — **prefer dashboard removal for speed during an incident**

2. **DNS records** (Cloudflare → **998webdesigns.com** → DNS):
   - **`www`** — `CNAME` → `cname.vercel-dns.com` (Proxied orange cloud OK)
   - **Apex `@`** — Vercel → Project → Settings → **Domains** → add `998webdesigns.com` + `www.998webdesigns.com`; follow Vercel’s shown records (often apex `A` `76.76.21.21` or CNAME flatten to `cname.vercel-dns.com` on Cloudflare)

3. Wait for propagation (usually 1–5 min on Cloudflare). Confirm:
   ```bash
   curl -sI https://998webdesigns.com | head -5
   curl -s https://998webdesigns.com/api/admin/env-status \
     -H "Authorization: Bearer YOUR_BALANCE_CAPTURE_SECRET"
   ```

### Step 4 — Crons during Vercel rollback

Production crons run via **GitHub Actions** (`.github/workflows/cf-cron.yml`), not Vercel Cron.

- **No change needed** if `CRON_TARGET_URL` secret is unset (defaults to `https://998webdesigns.com`) and apex now serves Vercel — scheduled GETs hit the same routes on Vercel.
- If crons must target a Vercel preview URL temporarily, set repo secret `CRON_TARGET_URL` to that host.
- Do **not** re-add `vercel.json` crons unless you intentionally want duplicate schedules.

Manual cron (same as incident debugging on CF):

GitHub → Actions → **Cloudflare cron triggers** → **Run workflow** → pick job (`ten-year-hosting`, `publish-scheduled-blog`, `instantly-enroll`).

### Step 5 — Post-rollback checklist

- [ ] https://998webdesigns.com loads; nav/footer version matches expected deploy
- [ ] `GET /api/admin/env-status` clean on apex
- [ ] Stripe Dashboard → Webhooks → recent deliveries to `https://998webdesigns.com/api/stripe/webhook` succeeding
- [ ] `/crm/login` works with `CRM_ADMIN_SECRET`
- [ ] Disable or leave paused **Deploy Cloudflare** on `main` until you cut back (optional)

### Return to Cloudflare (after incident)

1. Fix root cause on a branch; merge to `main`.
2. Confirm **Deploy Cloudflare** workflow green; optional smoke on `*.workers.dev` if available.
3. Re-attach Worker custom domains (`998webdesigns.com`, `www.998webdesigns.com`) in CF dashboard or restore `routes` in `wrangler.jsonc` + deploy.
4. Remove Vercel apex/www from Vercel **Domains** (or leave idle); run `npx vercel git disconnect` again if reconnected.
5. Verify apex `env-status` shows `hostPlatform: cloudflare-workers`.
6. Re-enable **Deploy Cloudflare** on `main` if paused.

---

## Environment variables (reference)

Set on the **Cloudflare Worker** for production. Vercel copy optional for rollback only:

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
3. Copy the **signing key** to the CF Worker as `CALENDLY_WEBHOOK_SIGNING_KEY` (`node scripts/setup-calendly-webhook.mjs` or Wrangler).

Prospects are matched via `utm_campaign=<prospect uuid>` on the Calendly URL (set automatically) with email fallback.

If env-status warns about a mismatched `NEXT_PUBLIC_BOOK_CALL_URL`, delete the var on the Worker and redeploy.

Secrets live in workspace `.local/` (gitignored). Never commit keys.

## Stripe: test vs live

**Production today:** Live mode (`sk_live_...`), `STRIPE_EXPECTED_MODE=live`, Bear LLC Payments account.

**Sandbox (optional):** Use `sk_test_...` on a Preview deploy or locally with `STRIPE_EXPECTED_MODE=test`. Card `4242 4242 4242 4242` in Stripe Sandbox.

**Go-live checklist (already done on prod unless you rotate keys):**

1. Stripe Dashboard → **Live** mode → Developers → API keys → `sk_live_...`.
2. Webhooks → endpoint `https://998webdesigns.com/api/stripe/webhook` with events below → copy **live** `whsec_...`.
3. CF Worker → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, redeploy.
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

Re-apply from workspace: `GO-FIX-SUPABASE-998.ps1` or update Worker secrets via `sync-cf-worker-secrets.mjs`.

## Supabase + GitHub

**Day-to-day:** CF Worker ↔ helmet (env vars + live tables). No Vercel required.

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

1. **Edge** (`middleware.ts`) - in-memory burst protection per isolate.
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

**Subdomain (optional):** Cloudflare DNS → `crm.998webdesigns.com` on the same Worker (custom domain in `wrangler.jsonc` or CF dashboard). The app route stays `/crm`.

`robots.txt` disallows `/crm`. Not in the public sitemap.

---

## Cloudflare migration (completed 2026-06-30)

Phases 1–5 done: OpenNext on Workers, DNS on apex + www, secrets synced, `cf-cron.yml` live, Vercel git disconnected.

| Phase | Status |
|-------|--------|
| OpenNext scaffold + CF deploy | **Done** |
| DNS cutover (`998webdesigns.com`, `www`) | **Done** |
| Crons (`cf-cron.yml`, GET + bearer) | **Done** |
| Vercel decommission (git disconnect, crons removed) | **Done** |

Full rollback runbook: **Emergency rollback to Vercel** (above).

