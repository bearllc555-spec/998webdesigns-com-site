# Deployment — 998webdesigns.com

## Vercel project (only one)

| | |
|---|---|
| **Project** | `998webdesigns-com-site` |
| **Production URL** | https://998webdesigns.com |
| **GitHub** | `bearllc555-spec/998webdesigns-com-site` — push `main` auto-deploys |

Do not use `998webdesigns-com-app` (deleted). Link the repo with:

```bash
npx vercel link --project 998webdesigns-com-site
```

## Environment variables (Production)

Set on **998webdesigns-com-site** in Vercel → Settings → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Checkout + webhook |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` |
| `RESEND_API_KEY` | Contact form + lead emails + internal payment alerts |
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

## Internal payment alerts

On each completed checkout, Resend emails `hello@998webdesigns.com` (`lib/internal-lead-email.ts`). Uses the same `RESEND_API_KEY` as the contact form.

## Checkout return URLs (audit item 6)

`/api/leads` only allows these origins for Stripe `success_url` / `cancel_url`:

- `https://998webdesigns.com`, `https://www.998webdesigns.com`
- `*.vercel.app` on Preview deployments
- `http://localhost:*` in local dev

Any other `Origin` header falls back to `https://998webdesigns.com`.

## SEO (sitemap / robots)

Indexable routes live in `lib/sitemap-config.ts`. `/thanks` and `/api/*` are excluded from the sitemap and blocked in `robots.txt`. Bump `SITEMAP_LAST_MODIFIED` in that file when home or legal pages change materially.
