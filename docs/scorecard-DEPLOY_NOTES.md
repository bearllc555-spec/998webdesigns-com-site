# Deploy notes — Website Scorecard (998 Next.js + Supabase + VPS)

**App layer:** integrated into this repo (OpenNext on Cloudflare Workers), not a
separate Pages project.

| Route | File |
|---|---|
| `/scorecard` | `app/scorecard/page.tsx` + `components/ScorecardForm.tsx` |
| `/api/scorecard` | `app/api/scorecard/route.ts` |
| `/r/[token]` | `app/r/[token]/route.ts` |
| `/api/scorecard/bounce` | Resend bounce webhook |

**VPS generator:** `scorecard/generator/` (Playwright + queue worker).

**Migration:** `supabase/migrations/20260630120000_scorecard.sql` creates
`public.leads` (scorecard prospects, separate from `wd_leads`) + scorecard tables.

---

# Original runbook (VPS + Supabase unchanged)

This supersedes the original Vercel notes. The split is clean:
**Cloudflare Workers (this Next.js app) = user-facing; VPS = score+screenshot engine;
Supabase = data + storage.**

---

## 0. Order of operations (matches the brief)
1. Inspect the live Supabase (`db/00_INSPECT_FIRST.sql`). Confirm the leads
   table name + PK type. STOP and ask if there's no stable unique id.
2. Run migrations on a Supabase **dev branch**; verify RLS (`db/02_verify.sql`).
3. Stand up the VPS generator service; test **Door 1** end-to-end first.
4. Deploy the Cloudflare app layer; test the **Door 2** queue path end-to-end.
5. Add rate-limiting + dedup (already in the code; verify they trip).
6. Run the security checklist; promote to prod.

---

## 1. Supabase

```
# in the SQL editor / psql, on the DEV BRANCH:
#   a) run 00_INSPECT_FIRST.sql, read the output
#   b) fill the CONFIG in 01_scorecard_core.sql (leads table + pk type)
#   c) run 01_scorecard_core.sql
#   d) (optional) 01b_optional_starter_leads.sql if no leads table exists
#   e) (optional) 01c_optional_enqueue_rpc.sql for anon-key enqueue
#   f) run 02_verify.sql and the manual anon checks at its end
```

Create the Storage bucket for screenshots:
- Dashboard → Storage → New bucket → name `scorecard-shots` → **Public** (the
  email needs public image URLs). Objects are random-named; no enumeration risk
  beyond the images themselves, which are non-sensitive marketing screenshots.

Verify RLS (the gate):
- anon CANNOT `select * from scorecard_reports / _signals / _jobs`.
- anon CAN `rpc('get_report_by_token', { p_token })` for a known token.
- a bad token and a superseded token both return NULL (indistinguishable).

---

## 2. VPS generator service (Oracle Cloud — `hermes-agent`)

**Production host (2026-08-29):** Oracle Cloud VM `hermes-agent` (`157.151.236.136`).
SSH: `ssh -i ~/.ssh/hermes-oracle ubuntu@157.151.236.136` (sudo for systemd).

**Retired:** Hostinger KVM `srv1796872` (`2.24.70.149`) — scorecard units disabled.

**Port note:** uvicorn binds **`127.0.0.1:8081`** (not 8080 — `temporal-ui` Docker uses 8080).
Cloudflare Tunnel ingress in `/etc/cloudflared/config.yml` must match (`http://127.0.0.1:8081`).

```bash
sudo mkdir -p /opt/scorecard && cd /opt/scorecard
# copy generator/ here (scorer_core.py, supabase_generator.py, service.py,
# requirements.txt) and create .env from generator/.env.example
python3 -m venv venv && . venv/bin/activate
pip install -r generator/requirements.txt
python3 -m playwright install chromium
python3 -m playwright install-deps        # system libs for headless Chrome
```

systemd units:

```ini
# /etc/systemd/system/scorecard-api.service
[Unit]
Description=Scorecard generator API (Door 1)
After=network.target
[Service]
WorkingDirectory=/opt/scorecard/generator
EnvironmentFile=/opt/scorecard/.env
ExecStart=/opt/scorecard/venv/bin/uvicorn service:app --host 127.0.0.1 --port 8081
Restart=always
[Install]
WantedBy=multi-user.target
```
```ini
# /etc/systemd/system/scorecard-worker.service
[Unit]
Description=Scorecard queue worker (Door 2)
After=network.target
[Service]
WorkingDirectory=/opt/scorecard/generator
EnvironmentFile=/opt/scorecard/.env
ExecStart=/opt/scorecard/venv/bin/python3 service.py --worker
Restart=always
[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now scorecard-api scorecard-worker
sudo systemctl status scorecard-api scorecard-worker
journalctl -u scorecard-worker -f      # watch jobs process
```

### Instant Telegram when a report finishes (recommended)

After each Door 2 job, the worker calls `POST https://998webdesigns.com/api/scorecard/notify`
(`scorecard_ready` Telegram). Requires **`GENERATOR_API_KEY`** in `/opt/scorecard/.env`
(must match the Cloudflare Worker secret — `slatepress/.local/scorecard-generator-api-key.txt`).

**On your PC:** double-click `scripts/SETUP-VPS-SCORECARD-TELEGRAM.cmd` — copies the key and
prints the VPS one-liner.

**On the VPS (root):**

```bash
curl -fsSL -o /tmp/vps-enable-instant-telegram.sh \
  "https://raw.githubusercontent.com/bearllc555-spec/998webdesigns-com-site/main/scorecard/generator/vps-enable-instant-telegram.sh"
bash /tmp/vps-enable-instant-telegram.sh 'PASTE_GENERATOR_API_KEY_HERE'
```

Also sync the same key to the Cloudflare Worker (from the repo on your PC):

```bash
node scripts/sync-cf-worker-secrets.mjs
```

After a test scorecard, worker logs should show `crm notify ok domain=...`. If you see
`crm notify skipped: ... GENERATOR_API_KEY=MISSING`, the VPS `.env` line is missing.

### Design intelligence (Awwwards + WebsiteRating)

CRM internal briefs read `scorecard_reports.internal_intel`. The worker module
**`design_intel.py`** must exist on the VPS (not just `service.py`).

**Full generator sync on VPS:**

```bash
curl -fsSL -o /tmp/vps-sync-generator.sh \
  "https://raw.githubusercontent.com/bearllc555-spec/998webdesigns-com-site/main/scorecard/generator/vps-sync-generator.sh"
bash /tmp/vps-sync-generator.sh
```

The worker backfills missing intel on idle (~10s, 2 reports per cycle). One report now:
`POST https://generator.998webdesigns.com/fetch-intel` with `report_id`, `domain`,
`x-generator-key`.

### Networking — do NOT expose a raw open port
The `/generate` endpoint must be reachable by Door 1's send-script but not the
public internet. Bind uvicorn to `127.0.0.1` (above) and front it with **one**
of:
- A **Cloudflare Tunnel** (`cloudflared`) → a hostname like
  `https://generator.998webdesigns.com`, protected by Cloudflare Access (service
  token) + the `GENERATOR_API_KEY` header. (Cleanest; no open inbound port.)
- Or a firewall allowlist (ufw) limiting `:8081` to known caller IPs, plus the
  `GENERATOR_API_KEY` header. Always require the key regardless.

Test Door 1:
```bash
curl -s -X POST https://generator.998webdesigns.com/generate \
  -H "x-generator-key: $GENERATOR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"lead_id":"<real-lead-id>","domain":"example.com","business_name":"Example"}'
# -> {"report_url":"https://998webdesigns.com/r/..."}
```

**Oracle ops quick-check:**
```bash
sudo systemctl status scorecard-api scorecard-worker cloudflared
curl -sf http://127.0.0.1:8081/docs && echo ok
journalctl -u scorecard-worker -f
```

**Code sync on Oracle:** same as before — `bash vps-sync-generator.sh` (from repo).

---

## 3. Cloudflare Pages (the app layer)

Project layout (this repo's `cloudflare/`):
```
cloudflare/
  public/scorecard.html      # Door 2 form (static)
  public/_routes.json        # routes /r/* and /api/* to Functions
  functions/r/[token].js     # the report page (Door 1 + Door 2 destination)
  functions/api/scorecard.js # Door 2 submit handler
  wrangler.toml
```

```bash
cd cloudflare
# one-time: rate-limit KV
wrangler kv namespace create RL          # paste the id into wrangler.toml
# secrets (NOT in wrangler.toml):
wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY
# deploy
wrangler pages deploy public
```
Set plain vars (SUPABASE_URL, SUPABASE_ANON_KEY, BOOKING_URL, RL_*) in the
Pages dashboard or `[vars]`. **Redeploy after changing vars** — Pages does not
hot-reload them.

Map the routes on `998webdesigns.com`:
- `998webdesigns.com/r/<token>`     → report page
- `998webdesigns.com/scorecard`     → Door 2 form (the static html)
- `998webdesigns.com/api/scorecard` → Door 2 handler

Optional native edge rate-limit (per-IP) in addition to the KV limiter:
Cloudflare dashboard → Security → WAF → Rate limiting rules on `/api/scorecard`.

---

## 4. Email
- Transactional provider (Resend in the code; Postmark/SES swap is a few lines
  in `send_report_email`).
- Sender domain **separate from the cold-campaign domain** (e.g.
  `reports.998webdesigns.com`). Add SPF/DKIM/DMARC for that subdomain in the
  provider.
- Email is a teaser: two images (client's own site + the scorecard) with the
  **report link as the primary CTA**, and a **text fallback** (score + verdict
  + link) that renders with images blocked. Never image-only — already enforced
  in `_email_html` / `_email_text`.
- Bounces: wire the provider's bounce webhook to flip `email_status='bounced'`
  on the report row (a small extra Pages Function or a provider→Supabase
  webhook). For Door 2 (inbox-only) a bounce = dead lead, so keep it visible.
- CAN-SPAM: physical address + unsubscribe in the footer (env-driven).

---

## 5. Smoke test before prod
1. **Door 1:** `curl /generate` with the key for one real lead → URL returns,
   open it → report renders, score matches, tool/manual tags correct, page is
   `noindex` (view source), screenshots stored in the bucket.
2. **Door 2:** submit the form → "check your inbox" returns instantly → within
   a few seconds the report email arrives; **disable images** in the client and
   confirm the score + link still show (text fallback).
3. **Tamper** the token by one char → identical 404 to a random token.
4. **Hammer** the form → IP/domain rate-limit trips (429); a repeat domain
   within 14 days reuses the existing report (worker logs "deduped").
5. **Junk email** → bounce logged on the row (once the webhook is wired).
