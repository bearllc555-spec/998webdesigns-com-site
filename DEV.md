# Local development — 998webdesigns-com-site

Anthony often runs **multiple Cursor windows** on Windows 11. This doc keeps local URLs, ports, and sessions predictable.

---

## This repo’s local URL (pinned)

| Surface | URL |
|--------|-----|
| **Local dev** | http://localhost:3000 |
| **Production** | https://998webdesigns.com |

`npm run dev` runs `next dev -p 3000` (see `package.json`). Do not rely on auto-increment to 3001/3002 for this project.

**Sanity check:** Nav/footer show `SITE_VERSION` from `lib/version.ts`. Local and prod should match only after you’ve pulled and restarted dev, or after a deploy (~30–60s on Vercel).

---

## One Cursor window ≈ one job

- Open the **repo root** (`998webdesigns-com-site`), not the parent `slatepress` folder.
- **One** `npm run dev` per machine for this repo. If Next says another dev server is already running, use that instance or stop it — do not start a second copy.
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
| Vercel preview (branch deploy) | Review before merging to `main` |
| `https://998webdesigns.com` | After push to `main`; confirm `vNN` bumped |

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

- `CLAUDE.md` — stack, env, ship loop, pricing lock
- `DEPLOYMENT.md` — Vercel / Stripe production wiring
