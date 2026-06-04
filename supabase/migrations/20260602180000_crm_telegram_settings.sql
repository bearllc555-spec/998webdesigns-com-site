-- CRM-managed Telegram bot config (singleton row). Service-role API only.
create table if not exists public.crm_telegram_settings (
  id text primary key default 'default' check (id = 'default'),
  bot_token text,
  chat_ids text not null default '',
  chat_labels text,
  updated_at timestamptz not null default now()
);

alter table public.crm_telegram_settings enable row level security;
