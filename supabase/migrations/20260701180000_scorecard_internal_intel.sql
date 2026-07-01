-- Internal-only design intel (Report B). Never exposed via get_report_by_token.

alter table public.scorecard_reports
  add column if not exists internal_intel jsonb;

comment on column public.scorecard_reports.internal_intel is
  'Operator-only: Awwwards + WebsiteRating snapshots. CRM /crm/scorecard/r/[token] only.';

create or replace function public.get_report_by_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select case when r.id is null then null else json_build_object(
    'report', to_jsonb(r)
                - 'lead_id'
                - 'token'
                - 'email_status'
                - 'email_bounced_at'
                - 'superseded_at'
                - 'internal_intel',
    'signals', coalesce(
        (select json_agg(
            (to_jsonb(s) - 'report_id' - 'id' - 'created_at')
            order by s.sort_order)
         from public.scorecard_signals s where s.report_id = r.id), '[]'::json)
  ) end
  from public.scorecard_reports r
  where r.token = p_token and r.status = 'active'
  limit 1;
$$;
