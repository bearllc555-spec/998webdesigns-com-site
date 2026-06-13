# 998webdesigns-com-site

Marketing site and lead funnel for [998 web designs](https://998webdesigns.com) - Next.js 16, Stripe Checkout, Resend, Supabase.

| | |
|---|---|
| **Production** | https://998webdesigns.com |
| **Vercel project** | `998webdesigns-com-site` (push `main` to deploy) |
| **Handoff / architecture** | [`CLAUDE.md`](./CLAUDE.md) |
| **Deploy & Stripe go-live** | [`DEPLOYMENT.md`](./DEPLOYMENT.md) |

## Local dev

```bash
pnpm install
cp .env.example .env.local   # then fill from workspace .local/ (see CLAUDE.md)
pnpm dev
```

Open http://localhost:3000

## Scripts

```bash
pnpm dev      # development server
pnpm build    # production build
pnpm start    # serve production build
pnpm test     # vitest unit tests (lib/*.test.ts)
```

## What not to edit without approval

- Pricing copy in `components/Pricing.tsx` (locked product language).

## Version label

Bump `SITE_VERSION` in `lib/version.ts` on every deploy-visible change (shown in nav/footer).
