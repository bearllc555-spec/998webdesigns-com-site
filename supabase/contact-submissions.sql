-- Run once on helmet if you already ran schema.sql before contact_submissions existed.
-- Safe to re-run (IF NOT EXISTS).

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  name text not null,
  email text not null,
  business_name text,
  message text not null,
  ip text
);

create index if not exists contact_submissions_submitted_at_idx
  on public.contact_submissions (submitted_at desc);
create index if not exists contact_submissions_email_idx on public.contact_submissions (email);

alter table public.contact_submissions enable row level security;
