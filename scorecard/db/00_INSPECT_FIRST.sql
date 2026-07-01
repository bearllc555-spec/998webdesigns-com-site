-- ============================================================================
-- STEP 1 — INSPECT THE LIVE SCHEMA *BEFORE* RUNNING ANY MIGRATION
-- ============================================================================
-- The brief's hard rule: find the existing leads/prospects table, confirm its
-- name and primary-key type, and STOP if there is no stable unique id.
--
-- Run THIS file first (read-only). Record/paste the output, then fill the
-- CONFIG block at the top of 01_scorecard_core.sql with the two real values
-- before running the migration. Run against the DEV BRANCH.
-- ============================================================================

-- (a) List every base table in the public schema. Find the leads/prospects one.
--     Likely names: leads, prospects, plumbing_leads, contacts.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- (b) Inspect that table's columns. Replace LEADS_TABLE with the real name.
--     Confirm: PK column + type, the domain/website column, business-name
--     column, email column.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'LEADS_TABLE'      -- <-- put the real table name here
order by ordinal_position;

-- (c) Confirm the primary key column and its type (this is <<LEADS_PK_TYPE>>).
select kcu.column_name, c.data_type
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.table_schema   = tc.table_schema
join information_schema.columns c
  on c.table_schema = kcu.table_schema
 and c.table_name   = kcu.table_name
 and c.column_name  = kcu.column_name
where tc.table_schema = 'public'
  and tc.table_name   = 'LEADS_TABLE'  -- <-- put the real table name here
  and tc.constraint_type = 'PRIMARY KEY';

-- ----------------------------------------------------------------------------
-- DECISION GATE
-- ----------------------------------------------------------------------------
-- * If (c) returns a single column with data_type 'uuid' or 'bigint'/'integer',
--   you have a stable unique id. Set in 01_scorecard_core.sql:
--       leads_table   = that table name
--       leads_pk_type = uuid   (if data_type = 'uuid')
--                     = bigint (if data_type = 'bigint' or 'integer')
-- * If there is NO primary key, or it is composite/non-stable, STOP. Do not
--   invent an id. Ask Anthony. (plumbing-prospector keeps leads in a Google
--   Sheet, so a Supabase leads table may not exist yet — see
--   01b_optional_starter_leads.sql.)
-- ============================================================================
