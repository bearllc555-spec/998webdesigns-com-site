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
| `BALANCE_CAPTURE_SECRET` | Bearer token for `POST /api/admin/capture-balance` |
| `NEXT_PUBLIC_SUPABASE_URL` | Lead storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (if used client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | `wd_leads` inserts |

Secrets live in workspace `.local/` (gitignored). Never commit keys.

## Stripe: test vs live (audit item 3)

**Current intent:** Production may run `sk_test_...` while you test with card `4242 4242 4242 4242` in Stripe Sandbox.

**Before accepting real money:**

1. Stripe Dashboard → turn off Sandbox / use **Live** mode.
2. Developers → API keys → copy **live** secret (`sk_live_...`).
3. Developers → Webhooks → add endpoint `https://998webdesigns.com/api/stripe/webhook`, event `checkout.session.completed`, copy **live** signing secret (`whsec_...`).
4. Vercel → **998webdesigns-com-site** → Production → update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (not Preview unless you want live there too).
5. Redeploy Production.
6. Run one real small-charge test, then refund in Stripe if needed.

Server logs warn when Production still has `sk_test_` (`lib/stripe-env.ts`).

## Stripe webhook

- URL: `https://998webdesigns.com/api/stripe/webhook`
- Event: `checkout.session.completed` (required)
- Deposit flow creates a $499 balance authorization hold after payment.

## Internal lead alerts (Resend)

| When | Email to `hello@998webdesigns.com` |
|------|-------------------------------------|
| Form submitted, Checkout link created | **New lead — awaiting payment** (checkout URL + session link) |
| Checkout completed | **Payment received** (deposit or pay-in-full; deposit includes balance-hold link + capture instructions) |

Uses `RESEND_API_KEY`.

## Capture $499 balance after client approval

Deposit checkouts place a **manual-capture** PaymentIntent for the $499 balance. When the design is approved:

1. Set `BALANCE_CAPTURE_SECRET` in Vercel Production (long random string).
2. Call:

```bash
curl -X POST https://998webdesigns.com/api/admin/capture-balance \
  -H "Authorization: Bearer YOUR_BALANCE_CAPTURE_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"client@example.com\"}"
```

You can also pass `depositSessionId` (Checkout session id) or `leadId` (Supabase uuid).

Or capture in the [Stripe Dashboard](https://dashboard.stripe.com) on the balance-hold PaymentIntent linked in the payment email.

`wd_leads.status` becomes `balance_captured` on success.

## SEO (sitemap / robots)

Indexable routes live in `lib/sitemap-config.ts`. `/thanks` and `/api/*` are excluded from the sitemap and blocked in `robots.txt`. Bump `SITEMAP_LAST_MODIFIED` in that file when home or legal pages change materially.

## Supabase tables

Run **`supabase/schema.sql`** once in the Supabase SQL editor if not already applied:

- **`wd_leads`** — lead form rows from `/api/leads`
- **`api_rate_limits`** — shared rate limits across Vercel instances (5/min leads, 10/min contact per IP)

If tables are missing, leads still reach Stripe; Vercel logs will say `wd_leads table missing` or `api_rate_limits table missing`.

## Rate limiting

1. **Edge** (`proxy.ts`) — in-memory burst protection per isolate.
2. **API routes** — Postgres counters in `api_rate_limits` when Supabase is configured (global across regions).

## Checkout return URLs

`/api/leads` uses `lib/checkout-origin.ts` (audit item 6) — allowlisted origins only; no open redirect via `Origin`.
