# Stripe setup - 998webdesigns.com

Quick reference. Secrets live in `slatepress/.local/` (gitignored). Never commit keys.

---

## Modes

| Mode | Secret prefix | Cards |
|------|---------------|-------|
| **Test (sandbox)** | `sk_test_` | `4242 4242 4242 4242` |
| **Live** | `sk_live_` | Real cards only |

**Production:** Live keys (`sk_live_...`) with `STRIPE_EXPECTED_MODE=live` on the **Cloudflare Worker**.

---

## Production secrets (Cloudflare Worker)

**Worker:** `998webdesigns-com-site` → https://998webdesigns.com

Required production vars (Wrangler dashboard or `scripts/sync-cf-worker-secrets.mjs`):

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Checkout + webhook API |
| `STRIPE_WEBHOOK_SECRET` | Signs `/api/stripe/webhook` |
| `STRIPE_EXPECTED_MODE` | `test` or `live` (match key prefix) |
| `BALANCE_CAPTURE_SECRET` | Bearer for `GET /api/admin/env-status` |
| `RESEND_API_KEY` | Lead + payment emails |
| `NEXT_PUBLIC_SUPABASE_URL` | **helmet** project `xwldbxburzqryxlzocck` |
| `SUPABASE_SERVICE_ROLE_KEY` | `wd_leads` inserts |

After any change: redeploy via push to `main` (GitHub Actions) or `npm run cf:deploy`.

**Vercel (decommissioned 2026-06-30):** project kept for emergency rollback only — see `DEPLOYMENT.md`.

---

## Stripe Dashboard - test webhook (production URL)

1. https://dashboard.stripe.com/test/webhooks (Sandbox on)
2. **Add endpoint** → `https://998webdesigns.com/api/stripe/webhook`
3. Events: **`checkout.session.completed`**, **`checkout.session.async_payment_succeeded`**, **`checkout.session.async_payment_failed`**, plus **`invoice.payment_failed`** and **`customer.subscription.deleted`** for $98/mo hosting
4. Enable **ACH Direct Debit** under Settings → Payment methods (US bank account)
5. Copy **Signing secret** (`whsec_...`) → Worker `STRIPE_WEBHOOK_SECRET`
6. Redeploy (push `main` or `npm run cf:deploy`)

**Checkout:** Lead form picks bank (ACH, list price) or card (+3% on design + in-checkout hosting). No Stripe Tax.

**Go-live checklist (Dashboard, test + live):**

1. Settings → Payment methods → enable **ACH Direct Debit** (US).
2. Webhooks → endpoint `https://998webdesigns.com/api/stripe/webhook` must listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded` (ACH settled)
   - `checkout.session.async_payment_failed` (ACH failed - alerts hello@)
   - `invoice.payment_failed` (monthly hosting renewal failed)
   - `customer.subscription.deleted` (hosting canceled)
3. `GET /api/admin/env-status` (Bearer `BALANCE_CAPTURE_SECRET`) surfaces `readyForLiveCharges`, `stripeOps`, and any missing events.

Test keys: https://dashboard.stripe.com/test/apikeys

---

## Local dev (`http://localhost:3000`)

`.env.local` is built from `slatepress/.local/` (see repo `.env.example`).

**Checkout** works locally with `sk_test_` after `npm run dev`.

**Webhooks on localhost** need the Stripe CLI (not installed yet):

```powershell
# Install once: https://stripe.com/docs/stripe-cli#install
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the CLI’s `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET` while listening (differs from Dashboard production secret).

Without CLI, test the full paid flow on **https://998webdesigns.com** (test keys on Production).

---

## Verify wiring (no secrets in response)

```powershell
$token = Get-Content "C:\Users\thede\OneDrive\Documents\Claude\slatepress\.local\998-balance-capture-secret.txt" -Raw
$headers = @{ Authorization = "Bearer $($token.Trim())" }
Invoke-RestMethod -Uri "https://998webdesigns.com/api/admin/env-status" -Headers $headers
```

Check: `stripe.mode`, `warnings`, `readyForLiveCharges`.

---

## Go live (real money)

**Use your normal Chrome + Google** (not Cursor’s shared browser).

1. Stripe → turn **Test mode OFF** (Live).
2. **API keys:** https://dashboard.stripe.com/apikeys → copy **Secret key** (`sk_live_...`) → paste into  
   `slatepress/.local/stripe-live-secret-key.txt` (line below comments).
3. **Webhooks:** https://dashboard.stripe.com/webhooks → Add endpoint  
   `https://998webdesigns.com/api/stripe/webhook` → event `checkout.session.completed` → copy **Signing secret** → paste into  
   `slatepress/.local/stripe-live-webhook-secret.txt`.
4. Double-click **`GO-LIVE-STRIPE-998.cmd`** in the slatepress workspace root (updates CF Worker secrets + redeploys).

Or ask Cursor in Agent mode after the two `.local` files are filled.

5. env-status → one small real charge on https://998webdesigns.com → refund in Stripe if needed.

**Local `.env.local` stays on test keys** - do not use live keys for `npm run dev`.

---

## Checkout amounts (code)

- Design: **$7,998** pay-in-full (`lib/products.ts` → Checkout `price_data`)
- Promo codes: `lib/design-promo-codes.ts` (e.g. **LINKEDIN20** = 20% off design → **$4,798** line). Server-side in `lib/design-promo.ts`; hosting unchanged.
- Month-to-month hosting: **$98/mo** after 30-day trial (`lib/hosting-policy.ts` → `HOSTING_MONTHLY_PRODUCT` in Checkout subscription `price_data`)
- Optional 10-year hosting: **$2,996** on day 31 when selected on lead form

See `lib/checkout-line-items.ts`. New Checkout sessions use dynamic `price_data` - no Dashboard price ID to update for new signups.

---

## Customer billing portal (month-to-month hosting)

Self-serve card updates, invoices, and cancel-at-period-end for $98/mo clients.

| Surface | URL |
|---------|-----|
| Email form | https://998webdesigns.com/hosting/manage |
| Magic link API | `POST /api/hosting/portal/request` |
| Stripe redirect | `GET /api/hosting/portal/session?token=...` |

**One-time Stripe Dashboard / CLI setup**

1. Run (live account):  
   `node scripts/configure-stripe-billing-portal.mjs`  
   Uses `STRIPE_SECRET_KEY` or `slatepress/.local/stripe-live-secret-key.txt`.
2. Optional: paste printed `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` into Worker env.
3. Or configure manually: [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)  
   - Enable **payment method update** and **invoice history**  
   - Enable **subscription cancellation** → **At end of billing period**  
   - Disable product/plan switching and customer profile edits

Magic links are HMAC-signed with `BALANCE_CAPTURE_SECRET` (15-minute TTL). Eligible leads: `wd_leads` with `stripe_customer_id`, `stripe_subscription_id`, and `hostingChoice: monthly`.
