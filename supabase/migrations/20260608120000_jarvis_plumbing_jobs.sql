-- Metro Plumbing & Drain demo — appointments booked via Jarvis on /demo/plumbers
create table if not exists public.jarvis_plumbing_jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.voice_demo_leads (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft'
    check (status in ('draft', 'booked', 'emergency', 'quote_sent', 'cancelled')),
  flow_name text,
  service_type text,
  service_address text,
  appointment_date text,
  time_window text,
  price_range text,
  is_emergency boolean not null default false,
  promo_applied boolean not null default false,
  customer_email text,
  notes jsonb not null default '{}'::jsonb,
  confirmation_email_sent_at timestamptz,
  reminder_email_sent_at timestamptz
);

create index if not exists jarvis_plumbing_jobs_lead_id_idx
  on public.jarvis_plumbing_jobs (lead_id);

create index if not exists jarvis_plumbing_jobs_status_idx
  on public.jarvis_plumbing_jobs (status);

alter table public.jarvis_plumbing_jobs enable row level security;
