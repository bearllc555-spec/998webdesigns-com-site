-- Stripe webhook idempotency - skip duplicate event.id on retries
create table if not exists public.processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

create index if not exists processed_stripe_events_processed_at_idx
  on public.processed_stripe_events (processed_at desc);

alter table public.processed_stripe_events enable row level security;
