-- Calendly booking metadata on discovery prospects (webhook + confirmation page)
alter table public.discovery_prospects
  add column if not exists calendly_event_start_at timestamptz,
  add column if not exists calendly_invitee_uri text;
