# 998webdesigns-com-app — Project Handoff

Read at the start of every session that touches this repo. Captures stack, env, file layout, deploy flow, and what's wired vs deferred so a fresh session has full context.

---

## Status (v0.1 — initial scaffold, 2026-05-21)

**Local-only, not deployed yet.** Scaffolded as the replacement for the static `998webdesigns.com` Cloudflare Pages splash (repo `bearllc555-spec/998webdesigns-com-site`). When this app is reviewed and ready, DNS flips from CF Pages to Vercel and the static repo gets archived.

Pricing copy in `src/components/Pricing.tsx` is taken verbatim from the locked product brief. **Do not change pricing wording without explicit approval — the pricing language is the product.**

---

## What ships in v0.1

- Home page (`/`) — Hero with portfolio carousel, value props strip, How it works (4 steps), Pricing, FAQ accordion, 4-step embedded lead form, Footer.
- `/thanks` — post-submit timeline + auto-deliver clause stated up front.
- `/api/leads` — POST handler that validates, drops honeypot, attempts to persist to `wd_leads` Supabase table (logs + carries on if table is missing).
- Brand tokens locked in `src/app/globals.css` (primitive → semantic). Inter (body) + Fraunces (display) font pairing.
- Portfolio data layer at `src/data/portfolio.ts` — add a client = add one row.
- FAQ data at `src/data/faq.ts`.
- Placeholder SVG at `public/portfolio/placeholder.svg` — every entry points at this until real screenshots ship.

## What's deferred to next session

- **Stripe Invoicing** — `$499 deposit` invoice on submit, balance invoice on approval, `$98/mo` subscription, lifetime-upgrade flow, webhook handler at `/api/stripe/webhook`. Restricted API keys + signed webhook required.
- **SendGrid** — confirmation email to lead with deposit invoice link + delivery-flow recap.
- **Slack** — incoming-webhook ping to internal channel on every new lead.
- **Supabase `wd_leads` table** — needs to be created in the existing Supabase project (`jxthwtflrzudepxysgje`). Schema sketch in this doc, below.
- **shadcn/ui init** — for polished dialog/toast/table components (plain Tailwind controls suffice for v0.1).
- **`/portfolio`**, **`/pricing`**, **`/start`**, **`/legal/terms`**, **`/legal/privacy`** standalone pages.
- **Real rate-limit** via middleware (currently just a honeypot field + Supabase IP capture).
- **Security review + Lighthouse pass** before DNS cutover.
- **Vercel project + deploy wiring**.

---

## Quick links

| Surface | URL |
|---|---|
| Repo (private) | https://github.com/bearllc555-spec/998webdesigns-com-app |
| Vercel project | (to be created next session) |
| Live splash being replaced | https://998webdesigns.com/ |
| Old repo (legacy CF Pages static) | https://github.com/bearllc555-spec/998webdesigns-com-site |
| Supabase project | https://supabase.com/dashboard/project/jxthwtflrzudepxysgje |

---

## Stack

- **Next.js 16** (App Router, TypeScript, src/ layout, Tailwind CSS v4, no Turbopack)
- **Tailwind v4** with inline `@theme` (no `tailwind.config.ts` — config lives in `globals.css`)
- **Supabase** — Postgres + Auth + Storage (Free tier, shared with editor-v2)
- **Vercel** — deploy target, Hobby plan (next session)
- **Stripe** — Invoicing for deposit + balance + lifetime; Subscription for monthly hosting (next session)
- **SendGrid** — transactional email (next session)
- **Slack incoming-webhook** — internal lead alerts (next session)

## File layout

```
src/
├── app/
│   ├── api/leads/route.ts      # POST /api/leads — validates + inserts to wd_leads
│   ├── globals.css              # design tokens, Tailwind v4 @theme
│   ├── layout.tsx               # root layout, font wiring
│   ├── page.tsx                 # home — composes section components
│   └── thanks/page.tsx          # post-submit timeline + auto-deliver clause
├── components/
│   ├── Nav.tsx
│   ├── Hero.tsx                 # composes Carousel
│   ├── Carousel.tsx             # client — autoplay, arrow nav, pause-on-hover
│   ├── ValueProps.tsx
│   ├── HowItWorks.tsx
│   ├── Pricing.tsx              # PRICING COPY IS THE PRODUCT — do not edit without approval
│   ├── FAQ.tsx                  # client — accordion
│   ├── LeadForm.tsx             # client — 4-step form, honeypot, validation
│   └── Footer.tsx
├── data/
│   ├── portfolio.ts             # PortfolioItem[] — one row per client site
│   └── faq.ts                   # FAQItem[]
└── lib/
    └── supabase.ts              # supabaseAdmin() (server) + supabasePublic (anon)
public/
└── portfolio/placeholder.svg     # used for every carousel slot until real .jpg ships
```

---

## Env vars (.env.local — gitignored)

| Key | Source | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `<workspace>/.local/supabase-project-url.txt` | client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<workspace>/.local/supabase-publishable-key.txt` | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | `<workspace>/.local/supabase-secret-key.txt` | server only |
| `STRIPE_SECRET_KEY` | TBD next session — Stripe dashboard, restricted key | `/api/leads`, `/api/stripe/webhook` |
| `STRIPE_WEBHOOK_SECRET` | TBD next session | `/api/stripe/webhook` |
| `SENDGRID_API_KEY` | `<workspace>/.local/sendgrid-api-key.txt` | `/api/leads` |
| `SLACK_WEBHOOK_URL` | TBD next session — Slack admin | `/api/leads` |
| `LEAD_NOTIFY_EMAIL` | constant `hello@998webdesigns.com` | `/api/leads` |

Production env vars get set in Vercel → Project Settings → Environment Variables.

---

## Adding a new portfolio thumbnail

1. Save the screenshot as `public/portfolio/<slug>.jpg` (4:3 aspect ratio, ~1200x900 source preferred).
2. Add one entry to the `portfolio` array in `src/data/portfolio.ts`:
   ```ts
   {
     slug: "your-slug",
     name: "Client Name",
     industry: "One of the industries shown elsewhere",
     url: "https://their-live-site.com",
     thumbnail: "/portfolio/your-slug.jpg",
   }
   ```
3. Commit. The carousel and `/portfolio` page (when built) both render from this array.

---

## Supabase `wd_leads` table — schema sketch

To be created in the existing Supabase project next session. Suggested schema:

```sql
create table wd_leads (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  email text not null,
  business_name text not null,
  full_name text not null,
  ip text,
  payload jsonb not null,
  status text not null default 'new',
    -- 'new' | 'deposit_sent' | 'deposit_paid' | 'designing' | 'awaiting_approval' | 'delivered' | 'closed'
  stripe_customer_id text,
  stripe_deposit_invoice_id text,
  stripe_balance_invoice_id text,
  notes text
);
```

RLS: deny all to anon. Service-role inserts/reads only.

---

## How to ship a change

```
cd repos/998webdesigns-com-app
git checkout -b feat/<branch-name>
# ... edit ...
npm run dev            # local preview on :3000
npm run build          # confirm prod build still passes
git add . && git commit -m "<ascii-only msg>"
git push -u origin feat/<branch-name>
# open PR, review preview deploy, merge to main
```

Rules:
- **Never push directly to `main`.** Branch first, merge after preview review (Vercel auto-deploys preview URLs for every push).
- **ASCII-only commit messages.** (Same Cloudflare deployments-API gotcha applies if/when CF Pages ever sees this repo.)
- **One commit per change.**
- **Pricing copy** in `Pricing.tsx` is the product. Don't change wording without explicit approval.

---

## Recovery / cold restart

If `repos/998webdesigns-com-app/` is missing:
```bash
cd C:\Users\thede\OneDrive\Documents\Claude\slatepress\repos
git clone https://github.com/bearllc555-spec/998webdesigns-com-app
cd 998webdesigns-com-app
npm install
# Recreate .env.local from <workspace>/.local/ files (see Env vars section above)
npm run dev
```

If env vars are missing: read from `<workspace>/.local/` per the table above.

---

## Session log

| Date | Event |
|---|---|
| 2026-05-21 | v0.1 scaffold. Next.js 15 + Tailwind v4 + Supabase wired. Home, /thanks, /api/leads stub built. Pricing copy from locked brief. Stripe/SendGrid/Slack deferred to v0.2. |
