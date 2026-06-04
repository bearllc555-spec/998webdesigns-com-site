# Stripe setup — 998webdesigns.com

Quick reference. Secrets live in `slatepress/.local/` (gitignored). Never commit keys.

---

## Modes

| Mode | Secret prefix | Cards |
|------|---------------|-------|
| **Test (sandbox)** | `sk_test_` | `4242 4242 4242 4242` |
| **Live** | `sk_live_` | Real cards only |

**Current intent:** Test on Production until you flip go-live (see `DEPLOYMENT.md`).

Set `STRIPE_EXPECTED_MODE=test` or `live` on Vercel Production so `/api/admin/env-status` does not false-alarm.

---

## Vercel project (only one)

**`998webdesigns-com-site`** → https://998webdesigns.com

Required Production env vars:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Checkout + webhook API |
| `STRIPE_WEBHOOK_SECRET` | Signs `/api/stripe/webhook` |
| `STRIPE_EXPECTED_MODE` | `test` or `live` (match key prefix) |
| `BALANCE_CAPTURE_SECRET` | Bearer for `GET /api/admin/env-status` |
| `RESEND_API_KEY` | Lead + payment emails |
| `NEXT_PUBLIC_SUPABASE_URL` | **`jxthwtflrzudepxysgje`** project |
| `SUPABASE_SERVICE_ROLE_KEY` | `wd_leads` inserts |

Dashboard: https://vercel.com/bearllc555-6551s-projects/998webdesigns-com-site/settings/environment-variables

After any change: redeploy Production or push to `main`.

---

## Stripe Dashboard — test webhook (production URL)

1. https://dashboard.stripe.com/test/webhooks (Sandbox on)
2. **Add endpoint** → `https://998webdesigns.com/api/stripe/webhook`
3. Events: **`checkout.session.completed`**, **`checkout.session.async_payment_succeeded`**, **`checkout.session.async_payment_failed`** (ACH settlement)
4. Enable **ACH Direct Debit** under Settings → Payment methods (US bank account)
5. Copy **Signing secret** (`whsec_...`) → Vercel `STRIPE_WEBHOOK_SECRET` (Production)
6. Redeploy

**Checkout:** Lead form picks bank (ACH, list price) or card (+3% on design + in-checkout hosting). No Stripe Tax.

**Go-live checklist (Dashboard, test + live):**

1. Settings → Payment methods → enable **ACH Direct Debit** (US).
2. Webhooks → endpoint `https://998webdesigns.com/api/stripe/webhook` must listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded` (ACH settled)
   - `checkout.session.async_payment_failed` (ACH failed — alerts hello@)
3. `GET /api/admin/env-status` (Bearer `BALANCE_CAPTURE_SECRET`) surfaces `readyForLiveCharges` and Stripe reminders.

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
4. Double-click **`GO-LIVE-STRIPE-998.cmd`** in the slatepress workspace root (updates Vercel Production + redeploys).

Or ask Cursor in Agent mode after the two `.local` files are filled.

5. env-status → one small real charge on https://998webdesigns.com → refund in Stripe if needed.

**Local `.env.local` stays on test keys** — do not use live keys for `npm run dev`.

---

## Checkout amounts (code)

- Design: **$1,998** pay-in-full
- Optional ten-year hosting: **+$1,349** when selected on lead form

See `lib/checkout-line-items.ts`.
