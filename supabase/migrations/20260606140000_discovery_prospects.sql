-- Discovery pipeline prospects (SMS verify -> intake email -> call -> close link)
create table if not exists public.discovery_prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'started',
  full_name text not null,
  email text not null,
  phone text not null,
  goal text,
  sms_consent_at timestamptz,
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  intake jsonb,
  intake_submitted_at timestamptz,
  call_booked_at timestamptz,
  close_draft jsonb,
  close_sent_at timestamptz,
  wd_lead_id uuid,
  ip text,
  read_at timestamptz,
  inbox_flag text
);

create index if not exists discovery_prospects_email_idx on public.discovery_prospects (lower(email));
create index if not exists discovery_prospects_status_idx on public.discovery_prospects (status);
create index if not exists discovery_prospects_created_at_idx on public.discovery_prospects (created_at desc);

alter table public.discovery_prospects enable row level security;
