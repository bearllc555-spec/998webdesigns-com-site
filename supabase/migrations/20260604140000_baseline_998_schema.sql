-- Baseline schema for 998webdesigns.com (helmet: xwldbxburzqryxlzocck).
-- Idempotent (IF NOT EXISTS) for brownfield DBs already set up via schema.sql.

create table if not exists public.wd_leads (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  email text not null,
  business_name text not null,
  full_name text not null,
  ip text,
  payload jsonb not null,
  status text not null default 'new',
  stripe_customer_id text,
  stripe_deposit_invoice_id text,
  stripe_balance_invoice_id text,
  notes text
);

create index if not exists wd_leads_submitted_at_idx on public.wd_leads (submitted_at desc);
create index if not exists wd_leads_email_idx on public.wd_leads (email);

alter table public.wd_leads enable row level security;

create table if not exists public.api_rate_limits (
  rate_key text primary key,
  hit_count int not null default 1 check (hit_count >= 0),
  window_ends_at timestamptz not null
);

create index if not exists api_rate_limits_window_idx on public.api_rate_limits (window_ends_at);

alter table public.api_rate_limits enable row level security;

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  name text not null,
  email text not null,
  business_name text,
  message text not null,
  ip text
);

create index if not exists contact_submissions_submitted_at_idx
  on public.contact_submissions (submitted_at desc);
create index if not exists contact_submissions_email_idx on public.contact_submissions (email);

alter table public.contact_submissions enable row level security;
