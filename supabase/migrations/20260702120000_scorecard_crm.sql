-- Scorecard → CRM: read/flag on reports + contact name on leads

alter table public.leads
  add column if not exists full_name text;

alter table public.scorecard_reports
  add column if not exists read_at timestamptz,
  add column if not exists inbox_flag text;

comment on column public.scorecard_reports.read_at is 'CRM inbox read state';
comment on column public.scorecard_reports.inbox_flag is 'CRM inbox triage: star | check | alert';
