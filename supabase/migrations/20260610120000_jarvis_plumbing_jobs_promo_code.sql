-- Unique $50 coupon code per plumbing demo booking (lead tracking).
alter table public.jarvis_plumbing_jobs
  add column if not exists promo_code text;

create unique index if not exists jarvis_plumbing_jobs_promo_code_uidx
  on public.jarvis_plumbing_jobs (promo_code)
  where promo_code is not null;
