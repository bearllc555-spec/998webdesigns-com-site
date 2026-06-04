-- CRM inbox read/unread (null read_at = unread)
alter table public.wd_leads
  add column if not exists read_at timestamptz;

alter table public.contact_submissions
  add column if not exists read_at timestamptz;

-- Existing rows: mark read, then leave a few unread for inbox testing
update public.wd_leads
set read_at = submitted_at
where read_at is null;

update public.contact_submissions
set read_at = submitted_at
where read_at is null;

update public.wd_leads
set read_at = null
where id in (
  select id from public.wd_leads order by submitted_at desc limit 2
);

update public.contact_submissions
set read_at = null
where id in (
  select id from public.contact_submissions order by submitted_at desc limit 1
);
