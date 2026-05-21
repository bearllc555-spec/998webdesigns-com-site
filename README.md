# 998webdesigns-com-app

Next.js marketing + lead-capture app for **998webdesigns.com**. Replaces the static Cloudflare Pages splash with a Vercel-hosted Next.js app.

The full handoff (stack, env vars, deploy flow, pricing-copy lock, adding portfolio entries, Supabase schema sketch) lives in [`CLAUDE.md`](./CLAUDE.md) at the repo root. Read that first.

## Quick start

```bash
npm install
# .env.local is gitignored — recreate from workspace .local/ secrets per CLAUDE.md
npm run dev    # http://localhost:3000
npm run build  # production build
```

## Stack

Next.js 16 (App Router, TS, Tailwind v4, Turbopack) + Supabase + (v0.2) Stripe Invoicing + SendGrid + Slack. Deployed to Vercel.

## License

Private — Bear LLC. Not for redistribution.
