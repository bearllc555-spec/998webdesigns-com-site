-- Internal CRM call notes on discovery prospects (operator-only, not client-facing intake)
alter table public.discovery_prospects
  add column if not exists crm_notes text;
