-- Mirror of supabase/migrations/ (GitHub + Supabase integration). Prefer new migration files for changes.
-- Run once on helmet (xwldbxburzqryxlzocck): SQL editor or scripts/apply-helmet-schema.mjs
-- Service-role API routes bypass RLS. anon/authenticated are denied via block_anon_authenticated
-- policies (see migration 20260612120000_public_rls_security_hardening.sql).

-- Lead intake from /api/leads
create table if not exists public.wd_leads (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  email text not null,
  business_name text not null,
  full_name text not null,
  ip text,
  payload jsonb not null,
  -- new | awaiting_payment | awaiting_bank_settlement | bank_payment_failed | deposit_paid | milestone2_paid | balance_held | balance_captured | paid_in_full
  status text not null default 'new',
  stripe_customer_id text,
  stripe_deposit_invoice_id text,  -- Stripe Checkout session id (legacy column name)
  stripe_balance_invoice_id text,  -- legacy balance-hold PaymentIntent id (pre pay-in-full-only)
  stripe_subscription_id text,     -- month-to-month hosting Subscription id (when applicable)
  hosting_billing_starts_at timestamptz,  -- day 31 hosting charge (30 days after design paid)
  stripe_ten_year_session_id text,        -- day-31 lifetime hosting Checkout session id
  ten_year_hosting_paid_at timestamptz,   -- when lifetime hosting payment cleared
  notes text,
  read_at timestamptz,
  inbox_flag text check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'))
);

create index if not exists wd_leads_submitted_at_idx on public.wd_leads (submitted_at desc);
create index if not exists wd_leads_email_idx on public.wd_leads (email);

alter table public.wd_leads enable row level security;

-- Distributed API rate limits (/api/leads, /api/contact)
create table if not exists public.api_rate_limits (
  rate_key text primary key,
  hit_count int not null default 1 check (hit_count >= 0),
  window_ends_at timestamptz not null
);

create index if not exists api_rate_limits_window_idx on public.api_rate_limits (window_ends_at);

alter table public.api_rate_limits enable row level security;

-- Contact modal /api/contact (email + Supabase log)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  name text not null,
  email text not null,
  business_name text,
  message text not null,
  ip text,
  read_at timestamptz,
  inbox_flag text check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'))
);

create index if not exists contact_submissions_submitted_at_idx
  on public.contact_submissions (submitted_at desc);
create index if not exists contact_submissions_email_idx on public.contact_submissions (email);

alter table public.contact_submissions enable row level security;

-- CRM Telegram bot config (singleton; /api/crm/telegram PUT)
create table if not exists public.crm_telegram_settings (
  id text primary key default 'default' check (id = 'default'),
  bot_token text,
  chat_ids text not null default '',
  chat_labels text,
  updated_at timestamptz not null default now()
);

alter table public.crm_telegram_settings enable row level security;

-- Stripe webhook idempotency (/api/stripe/webhook)
create table if not exists public.processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

create index if not exists processed_stripe_events_processed_at_idx
  on public.processed_stripe_events (processed_at desc);

alter table public.processed_stripe_events enable row level security;

-- Discovery pipeline + inbound SMS (CRM)
create table if not exists public.discovery_prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'started',
  full_name text not null,
  company_name text,
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
  inbox_flag text,
  crm_notes text
);

alter table public.discovery_prospects enable row level security;

create table if not exists public.inbound_sms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_phone text not null,
  body text not null,
  twilio_message_sid text not null unique,
  discovery_prospect_id uuid references public.discovery_prospects (id) on delete set null,
  wd_lead_id uuid,
  read_at timestamptz,
  inbox_flag text
);

alter table public.inbound_sms enable row level security;

-- LinkedIn outreach (OpenOutreach -> Instantly handoff)
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

alter table public.linkedin_prospects enable row level security;

-- Optional: purge stale rate-limit rows (run via cron or manually)
-- delete from public.api_rate_limits where window_ends_at < now() - interval '1 day';
