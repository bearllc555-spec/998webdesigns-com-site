-- Idempotent Telegram when a scorecard report is ready (VPS notify + app backfill).

alter table public.scorecard_reports
  add column if not exists crm_ready_notified_at timestamptz;

comment on column public.scorecard_reports.crm_ready_notified_at is
  'CRM Telegram scorecard_ready sent once (notify route, status poll, or cron backfill)';

create index if not exists scorecard_reports_crm_ready_notify_idx
  on public.scorecard_reports (created_at desc)
  where crm_ready_notified_at is null
    and email_status = 'sent'
    and status = 'active';
