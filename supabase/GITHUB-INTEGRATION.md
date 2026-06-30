# Supabase ↔ GitHub integration (998webdesigns.com)

**Project:** helmet · `xwldbxburzqryxlzocck`

Production app runs on **Cloudflare Workers** (OpenNext). Supabase connects to the app via env vars on the Worker (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) — not via this GitHub form.

The Supabase dashboard **GitHub** integration is **optional**. It auto-applies migrations from the repo when configured; the site works without it if you apply SQL manually or use `.github/workflows/supabase-migrations.yml`.

---

## If "Save changes" won't work on Supabase GitHub settings

The Pro / Branching banner is **not** the blocker.

### Try this reset (2 minutes)

1. On Integrations, click **Disable integration** (GitHub section) and confirm.
2. Refresh the page.
3. Connect GitHub again → pick **`998webdesigns-com-site`**.
4. **Working directory:** `.` (one period — not `/`, not `supabase`).
5. **Deploy to production:** ON · **Production branch:** `main`.
6. Click **Enable integration** (first-time button) or **Save changes**.

### Use the right Save button

There are two cards on the Integrations page:

| Card | When to touch it |
|------|------------------|
| **GitHub** | Only if you want Supabase to pull migrations from the repo on push to `main`. Use **this** card's **Save changes**. |
| **Vercel** | **Legacy (decommissioned 2026-06-30).** Production is not on Vercel. Ignore unless you are emergency-rolling back — see `DEPLOYMENT.md`. |

---

## Production wiring (what actually matters)

| Layer | How helmet is reached |
|-------|------------------------|
| **Runtime** | Cloudflare Worker `998webdesigns-com-site` |
| **Secrets** | Wrangler dashboard or `node scripts/sync-cf-worker-secrets.mjs` |
| **Migrations** | GitHub Actions `.github/workflows/supabase-migrations.yml` **or** Supabase GitHub integration **or** manual SQL editor |

**Day-to-day:** Worker ↔ helmet env vars + live tables. No Supabase GitHub form required.

**Optional auto-migrations from git:** run once from workspace:

`slatepress/GO-FINISH-SUPABASE-GITHUB-998.cmd`

Sets GitHub secrets for `supabase-migrations.yml`. Token prompt → save to `.local/supabase-access-token.txt` and rerun.

---

## Skip entirely

You can ignore the Supabase GitHub integration if:

- Migrations already run via GitHub Actions or Cursor/SQL editor, and
- Worker env vars point at helmet (verify with `GET /api/admin/env-status`).

See also `supabase/README.md` and `DEPLOYMENT.md` (Supabase section).
