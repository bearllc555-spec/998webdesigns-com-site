-- LinkedIn outreach prospects (OpenOutreach -> Supabase -> Instantly handoff)
create table if not exists public.linkedin_prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  openoutreach_lead_id integer not null,
  openoutreach_deal_id integer,
  public_identifier text not null,
  linkedin_url text not null,
  full_name text,
  company_name text,
  email text not null,
  email_source text not null default 'chat_message',
  email_captured_at timestamptz,
  email_capture_snippet text,
  linkedin_state text,
  campaign_name text,
  status text not null default 'email_captured',
  instantly_lead_id text,
  instantly_campaign_id text,
  instantly_enrolled_at timestamptz,
  instantly_last_event_at timestamptz,
  instantly_last_event_type text,
  crm_notes text,
  chat_summary jsonb,
  profile_summary jsonb,
  read_at timestamptz,
  inbox_flag text check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'))
);

create unique index if not exists linkedin_prospects_openoutreach_lead_idx
  on public.linkedin_prospects (openoutreach_lead_id);

create unique index if not exists linkedin_prospects_public_identifier_idx
  on public.linkedin_prospects (public_identifier);

create index if not exists linkedin_prospects_email_idx
  on public.linkedin_prospects (lower(email));

create index if not exists linkedin_prospects_status_idx
  on public.linkedin_prospects (status);

create index if not exists linkedin_prospects_updated_at_idx
  on public.linkedin_prospects (updated_at desc);

alter table public.linkedin_prospects enable row level security;

drop policy if exists block_anon_authenticated on public.linkedin_prospects;
create policy block_anon_authenticated on public.linkedin_prospects
  for all to anon, authenticated using (false) with check (false);
