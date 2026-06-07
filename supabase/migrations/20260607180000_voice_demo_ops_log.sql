-- Voice demo session ops log (client-reported anomalies until flows are stable).
alter table public.voice_demo_leads
  add column if not exists ops_log jsonb not null default '[]'::jsonb;

create index if not exists voice_demo_leads_ops_log_gin_idx
  on public.voice_demo_leads using gin (ops_log);
