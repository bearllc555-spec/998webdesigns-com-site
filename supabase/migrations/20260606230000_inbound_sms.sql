-- Inbound SMS to 998 Twilio number (CRM inbox + Telegram alert)
create table if not exists public.inbound_sms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_phone text not null,
  body text not null,
  twilio_message_sid text not null unique,
  discovery_prospect_id uuid references public.discovery_prospects (id) on delete set null,
  read_at timestamptz,
  inbox_flag text
);

create index if not exists inbound_sms_created_at_idx on public.inbound_sms (created_at desc);
create index if not exists inbound_sms_from_phone_idx on public.inbound_sms (from_phone);
create index if not exists inbound_sms_discovery_idx on public.inbound_sms (discovery_prospect_id, created_at desc);
