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
3. Event: **`checkout.session.completed`**
4. Copy **Signing secret** (`whsec_...`) → Vercel `STRIPE_WEBHOOK_SECRET` (Production)
5. Redeploy

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

1. Stripe → **Live** mode
2. Copy `sk_live_...` and live webhook `whsec_...` for `https://998webdesigns.com/api/stripe/webhook`
3. Vercel Production → update both + `STRIPE_EXPECTED_MODE=live`
4. Redeploy → env-status → one small real charge → refund if needed

---

## Checkout amounts (code)

- Design: **$1,998** pay-in-full
- Optional ten-year hosting: **+$1,349** when selected on lead form

See `lib/checkout-line-items.ts`.
