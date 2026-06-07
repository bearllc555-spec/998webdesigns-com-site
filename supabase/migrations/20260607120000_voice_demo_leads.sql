-- Voice demo gate + CRM feed (homepage AI assistant)
create table if not exists public.voice_demo_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary_channel text not null check (primary_channel in ('email', 'sms')),
  email text,
  phone text,
  full_name text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  verification_code_hash text,
  verification_expires_at timestamptz,
  verification_attempts int not null default 0,
  promo_sent_at timestamptz,
  promo_code text,
  secondary_declined_at timestamptz,
  session_summary text,
  ip text,
  read_at timestamptz,
  inbox_flag text check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'))
);

create index if not exists voice_demo_leads_created_at_idx
  on public.voice_demo_leads (created_at desc);
create index if not exists voice_demo_leads_email_idx on public.voice_demo_leads (email);
create index if not exists voice_demo_leads_phone_idx on public.voice_demo_leads (phone);

alter table public.voice_demo_leads enable row level security;
