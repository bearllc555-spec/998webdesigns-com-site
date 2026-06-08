-- Tag voice demo leads by vertical so plumbing demo stays out of main 998 CRM feed.
alter table public.voice_demo_leads
  add column if not exists vertical text not null default 'marketing'
  check (vertical in ('marketing', 'plumbers'));

create index if not exists voice_demo_leads_vertical_idx
  on public.voice_demo_leads (vertical, updated_at desc);

-- Backfill plumbing callers that already have jarvis jobs.
update public.voice_demo_leads v
set vertical = 'plumbers'
where vertical = 'marketing'
  and exists (
    select 1 from public.jarvis_plumbing_jobs j where j.lead_id = v.id
  );
