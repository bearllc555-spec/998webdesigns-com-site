-- ============================================================================
-- OPTIONAL — only if there is NO existing Supabase leads table yet.
-- ============================================================================
-- The plumbing-prospector skill currently keeps leads in a Google Sheet, so it
-- is plausible no Supabase leads table exists. The scorecard FKs REQUIRE a
-- stable table to point at. If 00_INSPECT_FIRST.sql found nothing usable, this
-- gives you a minimal one. If a real table exists, DO NOT run this — point the
-- migration at the real table instead.
--
-- Decision for Anthony: confirm before running. This is a starter shape, not a
-- mirror of whatever the prospector sheet currently tracks.
-- ============================================================================
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  domain        text,                       -- website (no scheme), nullable
  email         text,
  phone         text,
  city          text,
  source        text,                       -- 'prospector' | 'form' | ...
  created_at    timestamptz not null default now()
);
-- If you run this, set in 01_scorecard_core.sql:  leads_table=leads  pk_type=uuid
