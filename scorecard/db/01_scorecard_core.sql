-- ============================================================================
-- Website Scorecard — Supabase migration (Phase 1 + Phase 2, consolidated)
-- ============================================================================
-- Run 00_INSPECT_FIRST.sql first, then fill the two values in the CONFIG block
-- directly below. They are the ONLY things you edit in this file.
--
-- HOW TO RUN
--   Supabase SQL editor: replace the two :'leads_*' references manually (the
--     editor does not support \set) — find/replace LEADS_TABLE_NAME and
--     LEADS_PK_TYPE below, then run. OR:
--   psql:  psql "$SUPABASE_DB_URL" -v leads_table=plumbing_leads \
--               -v leads_pk_type=uuid -f 01_scorecard_core.sql
--
-- Run against the DEV BRANCH first, verify RLS (see 02_verify.sql), then
-- promote to prod.
-- ============================================================================

-- ───────────────────────── CONFIG (edit these two) ─────────────────────────
-- If using psql with -v flags, leave these \set lines; they are overridden by
-- the command-line -v values. If using the Supabase SQL editor, IGNORE the
-- \set lines and instead find/replace the literal tokens
--   LEADS_TABLE_NAME  ->  your real leads table (e.g. plumbing_leads)
--   LEADS_PK_TYPE     ->  uuid  or  bigint
-- everywhere they appear below (two FK definitions).
\set leads_table   LEADS_TABLE_NAME
\set leads_pk_type LEADS_PK_TYPE
-- ────────────────────────────────────────────────────────────────────────────

-- ===========================================================================
-- reports
-- ===========================================================================
create table if not exists scorecard_reports (
  id            uuid primary key default gen_random_uuid(),
  lead_id       LEADS_PK_TYPE not null
                  references LEADS_TABLE_NAME(id) on delete cascade,
  token         text not null unique,           -- the access credential in the URL
  domain        text not null,
  business_name text not null,
  score         int  not null check (score between 0 and 100),
  verdict       text not null,                  -- 'good' | 'warning' | 'danger'
  competitor_name  text,
  competitor_score int,
  tested_on     date not null default current_date,
  status        text not null default 'active', -- 'active' | 'superseded'
  superseded_at timestamptz,
  -- ---- Phase 2 columns ----
  screenshot_url      text,    -- analysis report image (Supabase Storage)
  site_screenshot_url text,    -- client's own website image
  email_status        text,    -- 'sent' | 'bounced' | 'failed'
  email_bounced_at    timestamptz,
  source_door         text,    -- 'outbound' | 'form'
  created_at    timestamptz not null default now()
);

create index if not exists scorecard_reports_lead_idx
  on scorecard_reports(lead_id) where status = 'active';
create unique index if not exists scorecard_reports_token_idx
  on scorecard_reports(token);
-- supports the Door 2 dedup lookup (active report for a domain in last N days)
create index if not exists scorecard_reports_domain_active_idx
  on scorecard_reports(domain, created_at) where status = 'active';

-- ===========================================================================
-- signals (6 per report)
-- ===========================================================================
create table if not exists scorecard_signals (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references scorecard_reports(id) on delete cascade,
  key         text not null,        -- 'speed'|'security'|'reviews'|'seo'|'conversion'|'design'
  name        text not null,
  points      int,                  -- NULLABLE: locked signals store NULL points
  max_points  int  not null,
  line        text not null,
  source      text not null,        -- 'tool' | 'manual'   <-- honesty marker, never drop
  source_name text not null,        -- 'Google PageSpeed Insights', 'Manual review', ...
  sort_order  int  not null,
  locked      boolean not null default false,  -- Phase 2: Door 2 not-yet-assessed signals
  created_at  timestamptz not null default now()
);

create index if not exists scorecard_signals_report_idx
  on scorecard_signals(report_id);

-- ===========================================================================
-- job queue (Door 2). A table is enough; no extra infra.
-- ===========================================================================
create table if not exists scorecard_jobs (
  id          uuid primary key default gen_random_uuid(),
  lead_id     LEADS_PK_TYPE references LEADS_TABLE_NAME(id) on delete cascade,
  domain      text not null,
  payload     jsonb not null,                  -- name, company, email, phone, competitor info
  status      text not null default 'queued',  -- queued|claimed|done|failed
  attempts    int  not null default 0,
  claimed_at  timestamptz,
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists scorecard_jobs_status_idx
  on scorecard_jobs(status, created_at);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
-- The report page is PUBLIC (no login). RLS is therefore strict:
--   * anon may NOT select any scorecard table directly
--   * anon may read a single report ONLY via get_report_by_token(token)
--   * all writes happen via the service-role key (bypasses RLS), server-side
--   * scorecard_jobs is service-role only — no anon access at all
-- ---------------------------------------------------------------------------
alter table scorecard_reports enable row level security;
alter table scorecard_signals enable row level security;
alter table scorecard_jobs    enable row level security;

-- Block all direct client reads. (No "using (true)" anywhere — the only read
-- path for anon is the SECURITY DEFINER function below.)
drop policy if exists "anon reads reports (token-scoped via RPC)" on scorecard_reports;
create policy "anon reads reports (token-scoped via RPC)" on scorecard_reports
  for select to anon using (false);

drop policy if exists "anon reads signals (via RPC only)" on scorecard_signals;
create policy "anon reads signals (via RPC only)" on scorecard_signals
  for select to anon using (false);

-- scorecard_jobs: deliberately NO policy for anon/authenticated => zero access.
-- Only the service role (bypasses RLS) and the SECURITY DEFINER enqueue
-- function (below) can touch it.

-- ---------------------------------------------------------------------------
-- Safe read path: token -> one report + its signals. SECURITY DEFINER so it
-- runs with owner privileges and bypasses the (false) anon policies above,
-- but ONLY ever returns the single row whose token was presented.
-- ---------------------------------------------------------------------------
create or replace function get_report_by_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select case when r.id is null then null else json_build_object(
    'report', to_jsonb(r)
                - 'lead_id'              -- never expose lead_id to client
                - 'token'                -- no reason to echo the credential back
                - 'email_status'
                - 'email_bounced_at'
                - 'superseded_at',
    'signals', coalesce(
        (select json_agg(
            (to_jsonb(s) - 'report_id' - 'id' - 'created_at')
            order by s.sort_order)
         from scorecard_signals s where s.report_id = r.id), '[]'::json)
  ) end
  from scorecard_reports r
  where r.token = p_token and r.status = 'active'
  limit 1;
$$;

-- anon may call it (it self-limits to one token's data).
grant execute on function get_report_by_token(text) to anon;

-- ===========================================================================
-- Atomic job claim for the Door 2 worker (two workers never grab the same job)
-- ===========================================================================
create or replace function claim_scorecard_job()
returns scorecard_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  j scorecard_jobs;
begin
  select * into j
  from scorecard_jobs
  where status = 'queued'
  order by created_at
  for update skip locked              -- key: skip rows another worker locked
  limit 1;

  if j.id is null then
    return null;
  end if;

  update scorecard_jobs
    set status = 'claimed', claimed_at = now()
  where id = j.id
  returning * into j;

  return j;
end;
$$;

-- service-role only.
revoke all on function claim_scorecard_job() from anon, authenticated;

-- Writes: NO insert/update policy for anon/authenticated => only the
-- service-role key (server-side) can write. Keep it server-side only.
