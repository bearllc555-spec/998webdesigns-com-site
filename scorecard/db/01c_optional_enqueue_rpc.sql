-- ============================================================================
-- OPTIONAL (recommended) — Door 2 enqueue via SECURITY DEFINER RPC.
-- ============================================================================
-- Lets the Cloudflare Door 2 handler enqueue a job using the ANON key instead
-- of shipping the service-role key to the edge. Smaller blast radius: a leaked
-- edge secret can only enqueue jobs (rate-limited, validated), never read/write
-- reports. If you prefer the service-role-key-at-edge approach from the brief,
-- skip this file and have the handler insert into scorecard_jobs directly with
-- the service-role key.
--
-- This function does NOT create the lead row — keep lead creation server-side
-- (service role) OR extend this function to upsert the lead too. As written it
-- assumes the handler resolved/created lead_id already; pass null if leads are
-- created later by the worker. Adjust to your chosen flow.
-- ============================================================================
create or replace function enqueue_scorecard_job(
  p_lead_id   uuid,         -- change to bigint if your leads PK is bigint; or keep null
  p_domain    text,
  p_payload   jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  -- minimal server-side validation (defense in depth; edge also validates)
  if p_domain is null or length(trim(p_domain)) = 0 then
    raise exception 'domain required';
  end if;

  insert into scorecard_jobs (lead_id, domain, payload, status)
  values (p_lead_id, lower(trim(p_domain)), coalesce(p_payload, '{}'::jsonb), 'queued')
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function enqueue_scorecard_job(uuid, text, jsonb) to anon;
-- NOTE: rate-limiting lives at the Cloudflare edge (per-IP) + the worker dedup
-- (per-domain, 14-day). This RPC is intentionally thin.
