-- Voice demo: possible client location from weather ZIP lookups
alter table public.voice_demo_leads
  add column if not exists location_zip text,
  add column if not exists location_city text,
  add column if not exists location_state text;

create index if not exists voice_demo_leads_location_zip_idx
  on public.voice_demo_leads (location_zip)
  where location_zip is not null;
