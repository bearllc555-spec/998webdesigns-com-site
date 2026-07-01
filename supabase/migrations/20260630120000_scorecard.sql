-- Website Scorecard — leads table + reports/signals/jobs (Phase 1 + 2)
-- FK target: public.leads (uuid PK). Separate from wd_leads (paid intake funnel).

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  domain        text,
  email         text,
  phone         text,
  city          text,
  source        text,
  created_at    timestamptz not null default now()
);

create unique index if not exists leads_email_unique_idx
  on public.leads (lower(email))
  where email is not null;

alter table public.leads enable row level security;

drop policy if exists block_anon_authenticated on public.leads;
create policy block_anon_authenticated on public.leads
  for all to anon, authenticated using (false);

-- reports
create table if not exists public.scorecard_reports (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  token         text not null unique,
  domain        text not null,
  business_name text not null,
  score         int  not null check (score between 0 and 100),
  verdict       text not null,
  competitor_name  text,
  competitor_score int,
  tested_on     date not null default current_date,
  status        text not null default 'active',
  superseded_at timestamptz,
  screenshot_url      text,
  site_screenshot_url text,
  email_status        text,
  email_bounced_at    timestamptz,
  source_door         text,
  created_at    timestamptz not null default now()
);

create index if not exists scorecard_reports_lead_idx
  on public.scorecard_reports(lead_id) where status = 'active';
create unique index if not exists scorecard_reports_token_idx
  on public.scorecard_reports(token);
create index if not exists scorecard_reports_domain_active_idx
  on public.scorecard_reports(domain, created_at) where status = 'active';

-- signals (6 per report)
create table if not exists public.scorecard_signals (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.scorecard_reports(id) on delete cascade,
  key         text not null,
  name        text not null,
  points      int,
  max_points  int  not null,
  line        text not null,
  source      text not null,
  source_name text not null,
  sort_order  int  not null,
  locked      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists scorecard_signals_report_idx
  on public.scorecard_signals(report_id);

-- job queue (Door 2)
create table if not exists public.scorecard_jobs (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete cascade,
  domain      text not null,
  payload     jsonb not null,
  status      text not null default 'queued',
  attempts    int  not null default 0,
  claimed_at  timestamptz,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists scorecard_jobs_status_idx
  on public.scorecard_jobs(status, created_at);

alter table public.scorecard_reports enable row level security;
alter table public.scorecard_signals enable row level security;
alter table public.scorecard_jobs    enable row level security;

drop policy if exists "anon reads reports (token-scoped via RPC)" on public.scorecard_reports;
create policy "anon reads reports (token-scoped via RPC)" on public.scorecard_reports
  for select to anon using (false);

drop policy if exists "anon reads signals (via RPC only)" on public.scorecard_signals;
create policy "anon reads signals (via RPC only)" on public.scorecard_signals
  for select to anon using (false);

create or replace function public.get_report_by_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select case when r.id is null then null else json_build_object(
    'report', to_jsonb(r)
                - 'lead_id'
                - 'token'
                - 'email_status'
                - 'email_bounced_at'
                - 'superseded_at',
    'signals', coalesce(
        (select json_agg(
            (to_jsonb(s) - 'report_id' - 'id' - 'created_at')
            order by s.sort_order)
         from public.scorecard_signals s where s.report_id = r.id), '[]'::json)
  ) end
  from public.scorecard_reports r
  where r.token = p_token and r.status = 'active'
  limit 1;
$$;

grant execute on function public.get_report_by_token(text) to anon;

create or replace function public.claim_scorecard_job()
returns public.scorecard_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  j public.scorecard_jobs;
begin
  select * into j
  from public.scorecard_jobs
  where status = 'queued'
  order by created_at
  for update skip locked
  limit 1;

  if j.id is null then
    return null;
  end if;

  update public.scorecard_jobs
    set status = 'claimed', claimed_at = now()
  where id = j.id
  returning * into j;

  return j;
end;
$$;

revoke all on function public.claim_scorecard_job() from anon, authenticated;

create or replace function public.set_scorecard_email_status(
  p_report_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.scorecard_reports
    set email_status = p_status,
        email_bounced_at = case when p_status = 'bounced' then now() else email_bounced_at end
  where id = p_report_id;
end;
$$;

revoke all on function public.set_scorecard_email_status(uuid, text) from anon, authenticated;
