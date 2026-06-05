-- Mirror of supabase/migrations/ (GitHub + Supabase integration). Prefer new migration files for changes.
-- Run once on helmet (xwldbxburzqryxlzocck): SQL editor or scripts/apply-helmet-schema.mjs
-- Service-role API routes bypass RLS; anon/authenticated have no policies (denied).

-- Lead intake from /api/leads
create table if not exists public.wd_leads (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  email text not null,
  business_name text not null,
  full_name text not null,
  ip text,
  payload jsonb not null,
  -- new | awaiting_payment | awaiting_bank_settlement | bank_payment_failed | deposit_paid | balance_held | balance_captured | paid_in_full
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

-- Optional: purge stale rate-limit rows (run via cron or manually)
-- delete from public.api_rate_limits where window_ends_at < now() - interval '1 day';
