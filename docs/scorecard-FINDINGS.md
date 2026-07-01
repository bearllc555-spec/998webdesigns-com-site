# Website Scorecard — build findings & open decisions

Status of the brief's **Step 1** (inspect the live Supabase) and a record of
what was built, what's verified, and what still needs a human decision.

## Step 1 — schema inspection: BLOCKED (could not run live), handled safely
I have no Supabase connection in this session (no connector attached, no creds),
so I could not run the live inspection the brief mandates. Rather than guess the
`<<LEADS_TABLE>>` / `<<LEADS_PK_TYPE>>` values — which the brief explicitly says
to STOP on — I:
- wrote `db/00_INSPECT_FIRST.sql` (read-only) that you run in 30 seconds to get
  the real table name + PK type;
- reduced the migration's editable surface to a single CONFIG block (two
  values, marked, nothing else to touch);
- added `db/01b_optional_starter_leads.sql` because there's a real chance **no
  Supabase leads table exists yet** — the `plumbing-prospector` skill keeps
  leads in a **Google Sheet**. If inspection finds nothing usable, that's the
  STOP-and-ask moment: tell me whether to create the starter table or point at
  something else.

**Action needed from you:** run `00_INSPECT_FIRST.sql`, paste me the output (or
just the table name + PK type), and I'll hard-fill the two placeholders.

## Decisions captured
- **DB:** staying on Supabase (you confirmed). Oracle Cloud is parked; if you
  later want OCI's free Arm box as the *VPS host*, that's a no-code-change swap
  (generator is portable). Moving the *DB* to Oracle would mean rebuilding the
  RLS/RPC/anon-key/Storage layer — not recommended for this project.
- **Door 1 email:** `/generate` returns the URL only; your send-script embeds
  it and sends. (It does capture the two screenshots so your email can embed
  them.) Confirmed.

## Open decision I need you to make (honesty edge case)
On a **Door 2** report, conversion + design are **locked** (not yet measured),
so the maximum *displayable* score is **80**, but the dial still reads
"out of 100." This is technically honest — the two locked rows show "not yet
assessed," nothing measured is hidden, which satisfies the brief's hard rule.
But "62/100" can *read* worse than reality, since 18 of the missing points are
unmeasured, not failed. Three ways to handle it; I built option (a) as the
default because it changes nothing about the trusted Door 1 report:
  (a) Keep "/100", lean on the visible "not yet assessed" rows. (current)
  (b) Show Door 2 as "X / 80 measured — 2 sections unlock on a call."
  (c) Show the 4 measured signals only + a separate "2 more on a call" panel,
      no aggregate number until unlocked.
Tell me which you want; it's a small renderer change.

## What was built (all syntax-checked + logic smoke-tested)
- `db/` — consolidated Phase 1+2 migration with CONFIG block, RLS, the
  `get_report_by_token` + `claim_scorecard_job` RPCs, jobs table, locked flag,
  dedup index; plus inspect/verify/optional files.
- `generator/` — `service.py` with **both stubs implemented**: Playwright
  screenshots → Supabase Storage (capped wait, degrades gracefully) and Resend
  transactional email (two-image teaser + **text fallback**, CAN-SPAM footer).
  `supabase_generator.py` extended for Door 2 (automated Places reviews, locked
  conversion/design, dedup, source_door, screenshot/email status writes).
  `scorer_core.py` unchanged.
- `cloudflare/` — `/r/[token]` report page ported from the Next.js reference to
  a Pages Function (anon-key RPC read, noindex, indistinguishable 404, faithful
  approved design, locked-signal rendering); Door 2 form + submit handler
  (validate → per-IP/per-domain KV rate-limit → create lead → enqueue → instant
  "check your inbox"); wrangler config + routes.
- `docs/DEPLOY_NOTES.md` — Cloudflare/VPS/Supabase runbook + smoke tests.

## Verification done in this session
- Python `py_compile` clean on all three modules; JS `node --check` clean on
  both Functions.
- Secret-leak grep: no service-role / PageSpeed / Places / Resend / generator
  key in any client-served file. Service-role key used only in the edge handler
  `api/scorecard.js` (server-side) and named (not valued) in `wrangler.toml`.
- Logic smoke test with network/Supabase stubbed: Door 1 reproduces the
  mockup's 27/100 with correct tool/manual markers; Door 2 produces automated
  `reviews=tool (Google Places)` and `conversion`+`design` locked with NULL
  points (not 0). Verdict banding correct at all boundaries.

## What I could NOT do from here (needs your environment)
- Run the migration against your Supabase dev branch (no connection).
- Deploy to Cloudflare / the VPS (no tokens, no SSH). These are now
  deliverables + a runbook, per your "write all migrations/code" choice.
- Wire the email **bounce webhook** — that needs your Resend account; the
  `email_status` column + `set_email_status()` are ready for it.
