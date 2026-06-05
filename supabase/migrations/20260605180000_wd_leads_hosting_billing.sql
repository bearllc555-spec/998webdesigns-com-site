-- Ten-year hosting billed 30 days after design payment clears
alter table public.wd_leads
  add column if not exists hosting_billing_starts_at timestamptz,
  add column if not exists stripe_ten_year_session_id text,
  add column if not exists ten_year_hosting_paid_at timestamptz;

create index if not exists wd_leads_hosting_billing_starts_at_idx
  on public.wd_leads (hosting_billing_starts_at)
  where hosting_billing_starts_at is not null;
