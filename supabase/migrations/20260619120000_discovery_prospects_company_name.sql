-- Company name captured on /book (required before SMS verify)
alter table public.discovery_prospects
  add column if not exists company_name text;
