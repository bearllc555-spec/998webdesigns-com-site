-- Structured service address for CRM progressive intake (Jarvis booking flow).
alter table public.jarvis_plumbing_jobs
  add column if not exists service_street text,
  add column if not exists service_line2 text,
  add column if not exists service_city text,
  add column if not exists service_state text,
  add column if not exists service_zip text;
