# Supabase (998webdesigns.com)

**Project:** helmet · `xwldbxburzqryxlzocck`

## You are already set up for day-to-day use

- **Vercel** ↔ Supabase helmet (env vars) - connected in Integrations
- **Tables** on production: `wd_leads`, `contact_submissions`, `api_rate_limits`
- **App** reads/writes via API routes - no GitHub required

## Supabase dashboard “GitHub” form - optional

You can **ignore** it or leave as-is (repo + working directory `.` + **Deploy to production** ON).

Claude can also apply schema via the SQL editor when you ask for a DB change.

## Automatic migrations from Git (handled for you)

Repo includes `.github/workflows/supabase-migrations.yml`.

**One double-click** (only if you want push-to-main to auto-apply migrations):

`slatepress/GO-FINISH-SUPABASE-GITHUB-998.cmd`

That script sets GitHub secrets. If it asks for a token, paste it into `.local/supabase-access-token.txt` and run again.

## If you need a manual SQL change

Edit `supabase/schema.sql` and/or add `supabase/migrations/<timestamp>_name.sql`, or ask Cursor to run SQL in the Supabase SQL editor.
