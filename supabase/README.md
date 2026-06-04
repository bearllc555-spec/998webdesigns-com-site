# Supabase + GitHub (998webdesigns.com)

**Remote project:** `supabase-998webdesigns-helmet` · ref `xwldbxburzqryxlzocck`

Schema changes belong in **`supabase/migrations/`** (versioned). `schema.sql` is a human-readable mirror — keep it aligned when you add migrations.

## 1. Connect GitHub in Supabase (one-time)

1. Open [Integrations](https://supabase.com/dashboard/project/xwldbxburzqryxlzocck/settings/integrations) for helmet.
2. Under **GitHub**, click **Authorize GitHub** → approve **Supabase** on GitHub.
3. **Repository:** `bearllc555-spec/998webdesigns-com-site`
4. **Working directory:** leave empty (repo root; `supabase/` is at top level).
5. **Production branch:** `main`
6. Turn on **Deploy to production** (applies new migrations on push/merge to `main`).
7. Optional: **Automatic branching** (preview DB per PR).
8. Click **Enable integration**.

## 2. Baseline already on production

Helmet already has these tables (manual SQL). After GitHub is connected, mark the baseline migration as applied **once** so Supabase does not treat history as out of sync:

```bash
npx supabase login
npx supabase link --project-ref xwldbxburzqryxlzocck
npx supabase migration repair --status applied 20260604140000
```

(DB password or access token when prompted — from [Account tokens](https://supabase.com/dashboard/account/tokens) and project **Database** settings.)

## 3. Day-to-day workflow

```bash
npx supabase migration new describe_your_change
# edit supabase/migrations/<timestamp>_describe_your_change.sql
git add supabase/migrations/
git commit -m "db: describe your change"
git push origin main
```

With **Deploy to production** enabled, Supabase runs new migrations on `main` automatically.

## Local only (optional)

```bash
npx supabase start   # Docker local stack
npx supabase db reset
```

Not required for production; Vercel app uses hosted helmet + env vars.
