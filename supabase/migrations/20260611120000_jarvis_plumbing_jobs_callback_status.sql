-- Allow callback_requested when Jarvis cannot answer confidently and logs a human follow-up.
alter table public.jarvis_plumbing_jobs
  drop constraint if exists jarvis_plumbing_jobs_status_check;

alter table public.jarvis_plumbing_jobs
  add constraint jarvis_plumbing_jobs_status_check
  check (status in ('draft', 'booked', 'emergency', 'quote_sent', 'cancelled', 'callback_requested'));
