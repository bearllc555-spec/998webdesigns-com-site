-- Supabase Security Advisor (helmet): RLS on every public app table + explicit deny for
-- anon/authenticated PostgREST roles. API routes use service_role and bypass RLS.

do $$
declare
  t text;
begin
  foreach t in array array[
    'wd_leads',
    'api_rate_limits',
    'contact_submissions',
    'crm_telegram_settings',
    'processed_stripe_events',
    'discovery_prospects',
    'inbound_sms',
    'blog_posts',
    'voice_demo_leads',
    'jarvis_plumbing_jobs'
  ]
  loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists block_anon_authenticated on public.%I', t);
      execute format(
        'create policy block_anon_authenticated on public.%I for all to anon, authenticated using (false) with check (false)',
        t
      );
    end if;
  end loop;
end $$;
