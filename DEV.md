# Local development - 998webdesigns-com-site

Anthony often runs **multiple Cursor windows** on Windows 11. This doc keeps local URLs, ports, and sessions predictable.

---

## This repo’s local URL (pinned)

| Surface | URL |
|--------|-----|
| **Local dev** | http://localhost:3000 |
| **CRM (local)** | http://localhost:3000/crm |
| **Production** | https://998webdesigns.com |
| **CRM (prod)** | https://998webdesigns.com/crm |

`npm run dev` runs `next dev -p 3000` (see `package.json`). Do not rely on auto-increment to 3001/3002 for this project.

### CRM inside Cursor (Simple Browser)

1. **Run Task:** `Terminal` → `Run Task…` → **`998: dev + CRM tab`** - waits for Next ready, opens `/crm` in the editor browser panel (tab title **CRM**).
2. **Already on port 3000?** Run Task → **`998: open CRM in Cursor browser`** only.
3. **Manual:** Command Palette → **`Simple Browser: Show`** → `http://localhost:3000/crm`

Use the in-editor browser for CRM so it stays beside your code. External Chrome is fine for prod checks.

### CRM shows no messages locally (empty inbox)

The feed reads **helmet** (`xwldbxburzqryxlzocck`), same as production. If `.env.local` still points at the old Slatepress project (`jxthwtflrzudepxysgje`), the API returns **200 with zero rows** - not a browser bug.

**Fix:** Sync Supabase vars from `slatepress/.local/supabase-998-helmet-notes.txt` into repo `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` → `https://xwldbxburzqryxlzocck.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `sb_publishable_...` from that file
- `SUPABASE_SERVICE_ROLE_KEY` → `sb_secret_...` from that file

Then **restart** `npm run dev` (Next only loads `.env.local` at startup).

**Still empty after that?** Sign in again at `/crm/login` (session cookie is fine; the DB was wrong). If the UI shows a red error, run CRM migrations (`read_at`, `inbox_flag`) per `DEPLOYMENT.md`.

**Sanity check:** Nav/footer show `SITE_VERSION` from `lib/version.ts`. Local and prod should match only after you’ve pulled and restarted dev, or after a deploy (~1–2 min on Cloudflare).

---

## One Cursor window ≈ one job

- Open the **repo root** (`998webdesigns-com-site`), not the parent `slatepress` folder.
- **One** `npm run dev` per machine for this repo. If Next says another dev server is already running, use that instance or stop it - do not start a second copy.
- Strategy/copy-only work belongs in **Cowork**, not a second dev server here.

---

## Port 3000 blocked?

Something else (usually stray `node.exe` / old `next dev`) is listening on 3000.

```powershell
netstat -ano | findstr ":3000"
tasklist /FI "PID eq <pid>"
taskkill /PID <pid> /F
```

Only kill PIDs you recognize as Node. Confirm port is free:

```powershell
netstat -ano | findstr ":3000" | findstr LISTENING
```

(no output = free)

---

## Other projects (other Cursor windows)

Pin each repo to its own port so they never steal **3000**:

```json
"dev": "next dev -p 3001"
```

Bookmark bar labels should include the port: `998 :3000`, `editor :3001`, etc.

---

## Prod vs preview vs local

| URL type | When to use |
|----------|-------------|
| `http://localhost:3000` | Editing this repo in the active Cursor window |
| Cloudflare Worker preview | Feature branch + `deploy-cloudflare.yml`; see `DEPLOYMENT.md` |
| `https://998webdesigns.com` | After push to `main`; confirm `vNN` bumped (~1–2 min) |

**Cloudflare local preview:** `npm run cf:build` then `npm run cf:preview` (Wrangler). Requires WSL for best results on Windows.

---

## OneDrive

Project path is under `OneDrive\Documents\Claude\...`. Pause OneDrive before long edit sessions, or avoid editing this repo from two Cursor windows at once (sync conflicts revert files silently).

---

## Git in multi-window setups

- Only the window **working this repo** should commit/push here (see workspace rule: site edits always ship).
- Note active branch per window (`main` vs `fix/...`) so pushes do not collide.
- Pull before starting work if another session may have pushed.

---

## Session kickoff (paste into a new Cursor chat)

> Repo: `998webdesigns-com-site`. Local: http://localhost:3000. Read `CLAUDE.md` and `DEV.md`. Prod: https://998webdesigns.com.

---

## Related docs

- `CLAUDE.md` - stack, env, ship loop, pricing lock
- `DEPLOYMENT.md` - Cloudflare Workers / Stripe production wiring
