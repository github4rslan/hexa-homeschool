-- ────────────────────────────────────────────────────────────────────
--  HEXA — Row-Level Security policies
--  Children's Code: parents see ONLY their own children's data.
--  All tables default to deny; explicit policies grant access.
-- ────────────────────────────────────────────────────────────────────

-- Enable RLS on every personally-identifying table
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.instructional_logs enable row level security;
alter table public.evaluation_records enable row level security;
alter table public.competence_matrix enable row level security;
alter table public.compliance_dossiers enable row level security;
alter table public.external_audits enable row level security;

-- Public reference tables (curriculum is public knowledge)
alter table public.subject_domains enable row level security;
alter table public.topics enable row level security;
alter table public.academic_lessons enable row level security;

-- ════════════════════════════════════════════════════════════════════
--  parents — own row only
-- ════════════════════════════════════════════════════════════════════
create policy "parents_select_own" on public.parents
  for select using (auth_user_id = auth.uid());

create policy "parents_update_own" on public.parents
  for update using (auth_user_id = auth.uid());

create policy "parents_insert_self" on public.parents
  for insert with check (auth_user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
--  children — only parent's own
-- ════════════════════════════════════════════════════════════════════
create policy "children_select_own" on public.children
  for select using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

create policy "children_insert_own" on public.children
  for insert with check (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

create policy "children_update_own" on public.children
  for update using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

create policy "children_delete_own" on public.children
  for delete using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════
--  Child-scoped tables — parents read their child's records
-- ════════════════════════════════════════════════════════════════════

-- Helper to check parent-child relationship
create or replace function public.child_belongs_to_user(check_child_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.children c
    join public.parents p on p.id = c.parent_id
    where c.id = check_child_id
      and p.auth_user_id = auth.uid()
  );
$$ language sql security definer;

create policy "logs_select_own" on public.instructional_logs
  for select using (public.child_belongs_to_user(child_id));

create policy "evals_select_own" on public.evaluation_records
  for select using (public.child_belongs_to_user(child_id));

create policy "competence_select_own" on public.competence_matrix
  for select using (public.child_belongs_to_user(child_id));

create policy "dossiers_select_own" on public.compliance_dossiers
  for select using (public.child_belongs_to_user(child_id));

create policy "audits_select_own" on public.external_audits
  for select using (
    portfolio_id in (
      select id from public.compliance_dossiers
      where public.child_belongs_to_user(child_id)
    )
  );

-- ════════════════════════════════════════════════════════════════════
--  Curriculum reference — readable by all authenticated users
-- ════════════════════════════════════════════════════════════════════
create policy "subjects_read" on public.subject_domains
  for select using (auth.role() = 'authenticated');
create policy "topics_read" on public.topics
  for select using (auth.role() = 'authenticated');
create policy "lessons_read" on public.academic_lessons
  for select using (auth.role() = 'authenticated');
