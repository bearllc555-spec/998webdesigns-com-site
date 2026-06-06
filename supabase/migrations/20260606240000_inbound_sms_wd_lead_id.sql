-- Link inbound SMS to wd_leads (CRM Clients / Leads profile)
alter table public.inbound_sms
  add column if not exists wd_lead_id uuid references public.wd_leads (id) on delete set null;

create index if not exists inbound_sms_wd_lead_idx
  on public.inbound_sms (wd_lead_id, created_at desc);

-- Backfill from discovery_prospects.wd_lead_id where already linked
update public.inbound_sms s
set wd_lead_id = p.wd_lead_id
from public.discovery_prospects p
where s.discovery_prospect_id = p.id
  and s.wd_lead_id is null
  and p.wd_lead_id is not null;

-- Backfill by matching phone on wd_leads.payload
update public.inbound_sms s
set wd_lead_id = l.id
from public.wd_leads l
where s.wd_lead_id is null
  and l.payload->>'phone' = s.from_phone
  and l.id = (
    select id from public.wd_leads l2
    where l2.payload->>'phone' = s.from_phone
    order by l2.submitted_at desc
    limit 1
  );
