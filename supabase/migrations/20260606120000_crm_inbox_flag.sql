-- CRM inbox triage flags: null | star | check | alert
alter table public.wd_leads
  add column if not exists inbox_flag text
  check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'));

alter table public.contact_submissions
  add column if not exists inbox_flag text
  check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'));
