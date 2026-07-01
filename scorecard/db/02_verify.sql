-- ============================================================================
-- RLS / security verification — run AFTER the migration, on the dev branch.
-- ============================================================================
-- Expectation summary (the brief's gate):
--   * anon CANNOT select scorecard_reports / _signals / _jobs directly
--   * anon CAN call get_report_by_token(<valid token>) and get one report
--   * a bad token and a superseded token both return NULL (indistinguishable)
--   * scorecard_jobs has no anon access of any kind
-- ============================================================================

-- 1. RLS is enabled on all three tables (expect rowsecurity = true for each).
select relname, relrowsecurity
from pg_class
where relname in ('scorecard_reports','scorecard_signals','scorecard_jobs');

-- 2. Policies present (expect the two (false) select policies; NONE on jobs).
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where tablename like 'scorecard_%'
order by tablename, policyname;

-- 3. Function privileges: anon may EXECUTE get_report_by_token, and must NOT
--    have execute on claim_scorecard_job.
select p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'execute') as can_exec
from pg_proc p
cross join (select rolname from pg_roles where rolname in ('anon','authenticated','service_role')) r
where p.proname in ('get_report_by_token','claim_scorecard_job','enqueue_scorecard_job')
order by p.proname, r.rolname;

-- ----------------------------------------------------------------------------
-- 4. MANUAL anon checks — run these from the Supabase JS/SQL "anon" context
--    (e.g. supabase-js with the anon key, or the SQL editor with role anon):
--      set role anon;
--      select * from scorecard_reports;                 -- expect 0 rows / blocked
--      select * from scorecard_jobs;                     -- expect 0 rows / blocked
--      select get_report_by_token('a-known-good-token'); -- expect one report json
--      select get_report_by_token('definitely-not-real');-- expect NULL
--      reset role;
-- ----------------------------------------------------------------------------
