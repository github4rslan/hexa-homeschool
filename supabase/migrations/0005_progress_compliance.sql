-- ============================================================
-- HEXA · 0005 · Progress & Compliance — indexes, write-policies & retention
--
-- IMPORTANT: The Progress + Compliance tables ALREADY EXIST in 0001 under
-- HEXA's internal names:
--   instructional_logs   ← brief's "lesson_log"
--   evaluation_records   ← brief's "assessment_result"
--   competence_matrix    ← brief's "gap_map"      (competence_state enum)
--   compliance_dossiers  ← brief's "portfolio"
--   external_audits      ← brief's "la_interaction"
--
-- This migration is ADDITIVE ONLY. It does not recreate those tables. It:
--   1. Adds the composite index the brief calls for on the high-write log table.
--   2. Adds INSERT/UPDATE RLS policies (0002 only granted SELECT) so parents
--      can actually persist their own children's progress under the data silo.
--   3. Adds the GDPR 24-month retention purge function the brief mandates.
--
-- Idempotent — safe to re-run. Apply with:  supabase db push
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Performance: fast "recent telemetry per child" reads.
--    Brief: high volume of telemetry writes; reads must stay swift.
-- ─────────────────────────────────────────────
create index if not exists idx_logs_child_recent
  on public.instructional_logs (child_id, timestamp_start desc);

create index if not exists idx_evaluations_child_recent
  on public.evaluation_records (child_id, created_at desc);

create index if not exists idx_dossiers_child_recent
  on public.compliance_dossiers (child_id, generated_at desc);

-- ─────────────────────────────────────────────
-- 2. Write policies under the parent data-silo.
--    0002 enabled RLS + SELECT only. Without INSERT/UPDATE policies, an
--    authenticated parent cannot persist progress for their own child.
--    (Server actions using the service-role key bypass RLS regardless;
--     these policies make client-scoped writes safe too.)
-- ─────────────────────────────────────────────

-- instructional_logs (lesson attempts)
drop policy if exists "logs_insert_own" on public.instructional_logs;
create policy "logs_insert_own" on public.instructional_logs
  for insert with check (public.child_belongs_to_user(child_id));

drop policy if exists "logs_update_own" on public.instructional_logs;
create policy "logs_update_own" on public.instructional_logs
  for update using (public.child_belongs_to_user(child_id))
  with check (public.child_belongs_to_user(child_id));

-- evaluation_records (diagnostic + mock results)
drop policy if exists "evals_insert_own" on public.evaluation_records;
create policy "evals_insert_own" on public.evaluation_records
  for insert with check (public.child_belongs_to_user(child_id));

-- competence_matrix (mastery / gap state)
drop policy if exists "competence_insert_own" on public.competence_matrix;
create policy "competence_insert_own" on public.competence_matrix
  for insert with check (public.child_belongs_to_user(child_id));

drop policy if exists "competence_update_own" on public.competence_matrix;
create policy "competence_update_own" on public.competence_matrix
  for update using (public.child_belongs_to_user(child_id))
  with check (public.child_belongs_to_user(child_id));

-- compliance_dossiers (portfolios): parent may create + approve their own.
drop policy if exists "dossiers_insert_own" on public.compliance_dossiers;
create policy "dossiers_insert_own" on public.compliance_dossiers
  for insert with check (public.child_belongs_to_user(child_id));

drop policy if exists "dossiers_update_own" on public.compliance_dossiers;
create policy "dossiers_update_own" on public.compliance_dossiers
  for update using (public.child_belongs_to_user(child_id))
  with check (public.child_belongs_to_user(child_id));

-- ─────────────────────────────────────────────
-- 3. GDPR retention: purge accounts 24 months after closure.
--    Brief: "Automated systemic deletion flows execute exactly 24 months
--    post subscription death." A parent row with billing_status='canceled'
--    whose updated_at is >24 months old is purged; ON DELETE CASCADE on the
--    children → progress chain removes all dependent records.
--
--    Run on a schedule (Supabase cron / pg_cron):
--      select cron.schedule('hexa-retention', '0 3 * * *',
--                           $$ select public.purge_expired_accounts() $$);
-- ─────────────────────────────────────────────
create or replace function public.purge_expired_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  purged integer;
begin
  with deleted as (
    delete from public.parents
    where billing_status = 'canceled'
      and updated_at < (now() - interval '24 months')
    returning id
  )
  select count(*) into purged from deleted;
  return purged;
end;
$$;

comment on function public.purge_expired_accounts() is
  'GDPR 24-month retention purge. Deletes canceled parent accounts (and all '
  'cascaded child/progress/compliance data) 24 months after cancellation.';

-- ============================================================
-- End 0005
-- ============================================================
