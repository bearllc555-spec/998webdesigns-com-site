-- Extend voice demo verticals for med spa Jarvis demos.
alter table public.voice_demo_leads
  drop constraint if exists voice_demo_leads_vertical_check;

alter table public.voice_demo_leads
  add constraint voice_demo_leads_vertical_check
  check (vertical in ('marketing', 'plumbers', 'clinical', 'wellness'));
