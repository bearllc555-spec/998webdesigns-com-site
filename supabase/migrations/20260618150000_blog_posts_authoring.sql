-- Blog authoring: turn blog_posts (CRM feed mirror) into the canonical
-- source of truth for the /blog content + the /crm/blog dashboard.
-- Idempotent. Safe to re-run.

-- published_at is set automatically only at publish time, so drafts/scheduled
-- posts have no date yet.
alter table public.blog_posts
  alter column published_at drop not null;

alter table public.blog_posts
  add column if not exists body         text,
  add column if not exists tags         text[] not null default '{}',
  add column if not exists author       text not null default '998 web designs',
  add column if not exists featured     boolean not null default false,
  add column if not exists og_image_url text,
  add column if not exists status       text not null default 'draft',
  add column if not exists scheduled_at timestamptz,
  add column if not exists updated_at   timestamptz not null default now(),
  add column if not exists view_count   integer not null default 0,
  -- Internal editorial notes for staff (never shown on the public site).
  add column if not exists staff_notes  text;

-- status enum guard (added separately so re-runs do not fail if it exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'blog_posts_status_check'
  ) then
    alter table public.blog_posts
      add constraint blog_posts_status_check
      check (status in ('draft', 'scheduled', 'published', 'archived'));
  end if;
end $$;

-- Existing rows were all live posts.
update public.blog_posts
  set status = 'published'
  where status is null or status = 'draft' and published_at is not null;

create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_scheduled_at_idx on public.blog_posts (scheduled_at);

-- Refresh PostgREST's schema cache so new columns are queryable immediately.
notify pgrst, 'reload schema';
