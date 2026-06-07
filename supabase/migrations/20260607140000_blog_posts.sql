-- CRM feed: published blog posts (Field notes)
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  url text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  inbox_flag text check (inbox_flag is null or inbox_flag in ('star', 'check', 'alert'))
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;
