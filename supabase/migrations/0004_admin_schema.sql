-- ────────────────────────────────────────────────────────────────────
--  HEXA — Admin role + operational tables
--  Adds admin RBAC, audit log, escalation queue, agent telemetry,
--  tutor marketplace, feature flags, A/B experiments.
-- ────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════
--  ENUMS
-- ════════════════════════════════════════════════════════════════════

create type admin_role as enum (
  'super_admin',     -- full system access
  'operations',      -- escalations, user support
  'curriculum',      -- content management
  'compliance',      -- DSARs, LA liaison, audits
  'support',         -- read-only + ticket replies
  'tutor_manager'    -- marketplace tutor admin
);

create type escalation_type as enum (
  'safeguarding',     -- immediate
  'distress',         -- 5 min
  'concept_block',    -- 15 min
  'checker_cascade',  -- 15 min
  'manual_request',   -- 1 hour
  'statutory_audit',  -- 4 hour
  'systemic_drift'    -- 24 hour
);

create type escalation_status as enum (
  'open',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'breached_sla'
);

create type tutor_status as enum ('pending', 'verified', 'active', 'suspended');

create type experiment_status as enum ('draft', 'running', 'paused', 'completed');

-- ════════════════════════════════════════════════════════════════════
--  ADMINS — separate from parents
-- ════════════════════════════════════════════════════════════════════

create table public.admins (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role admin_role not null default 'support',
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_admins_role on public.admins(role);

-- ════════════════════════════════════════════════════════════════════
--  AUDIT LOG — immutable record of every admin action
-- ════════════════════════════════════════════════════════════════════

create table public.admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.admins(id),
  action text not null,                -- e.g. 'parent.suspend', 'escalation.assign'
  target_type text,                    -- 'parent', 'child', 'dossier', etc.
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now() not null
);

create index idx_audit_admin on public.admin_audit_log(admin_id);
create index idx_audit_created on public.admin_audit_log(created_at desc);
create index idx_audit_action on public.admin_audit_log(action);

-- ════════════════════════════════════════════════════════════════════
--  ESCALATIONS — the live safety net queue
-- ════════════════════════════════════════════════════════════════════

create table public.escalations (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references public.children(id) on delete cascade,
  parent_id uuid references public.parents(id) on delete cascade,
  type escalation_type not null,
  status escalation_status default 'open',
  trigger_payload jsonb default '{}'::jsonb,
  sla_minutes int not null,
  sla_deadline timestamptz not null,
  assigned_admin_id uuid references public.admins(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_escalations_status on public.escalations(status) where status != 'resolved';
create index idx_escalations_sla on public.escalations(sla_deadline) where status != 'resolved';
create index idx_escalations_type on public.escalations(type);

-- ════════════════════════════════════════════════════════════════════
--  AGENT TELEMETRY — per-agent invocation metrics
-- ════════════════════════════════════════════════════════════════════

create type agent_kind as enum (
  'diagnostic',
  'teaching',
  'assessment',
  'planning',
  'compliance',
  'meta_checker'
);

create table public.agent_invocations (
  id uuid primary key default uuid_generate_v4(),
  agent_kind agent_kind not null,
  child_id uuid references public.children(id) on delete set null,
  latency_ms int,
  tokens_input int,
  tokens_output int,
  cost_pence numeric(8, 4),
  checker_passed boolean,
  checker_block_reason text,
  created_at timestamptz default now() not null
);

create index idx_invocations_kind on public.agent_invocations(agent_kind);
create index idx_invocations_created on public.agent_invocations(created_at desc);
create index idx_invocations_blocked on public.agent_invocations(checker_passed) where checker_passed = false;

-- ════════════════════════════════════════════════════════════════════
--  TUTOR MARKETPLACE
-- ════════════════════════════════════════════════════════════════════

create table public.tutors (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text not null,
  status tutor_status default 'pending',
  domains text[] default '{}',                -- ['mathematics', 'english']
  dbs_check_ref text,                          -- UK enhanced DBS reference
  dbs_check_expires_at date,
  qualifications jsonb default '[]'::jsonb,
  hourly_rate_pence int default 4500,
  average_response_time_minutes int,
  rating numeric(3, 2),
  total_sessions int default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_tutors_status on public.tutors(status);
create index idx_tutors_domains on public.tutors using gin(domains);

create table public.tutor_assignments (
  id uuid primary key default uuid_generate_v4(),
  tutor_id uuid not null references public.tutors(id),
  escalation_id uuid references public.escalations(id),
  child_id uuid not null references public.children(id),
  scheduled_at timestamptz not null,
  duration_minutes int default 30,
  completed_at timestamptz,
  notes text,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now() not null
);

create index idx_assignments_tutor on public.tutor_assignments(tutor_id);
create index idx_assignments_child on public.tutor_assignments(child_id);

-- ════════════════════════════════════════════════════════════════════
--  DSAR — Data Subject Access Requests
-- ════════════════════════════════════════════════════════════════════

create type dsar_type as enum ('access', 'rectification', 'erasure', 'portability', 'restriction');
create type dsar_status as enum ('received', 'verified', 'in_progress', 'completed', 'rejected');

create table public.dsars (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references public.parents(id),
  requester_email text not null,
  type dsar_type not null,
  status dsar_status default 'received',
  details text,
  assigned_admin_id uuid references public.admins(id),
  due_date date not null,                      -- 30 days from receipt per UK GDPR
  completed_at timestamptz,
  export_file_path text,
  created_at timestamptz default now() not null
);

create index idx_dsars_status on public.dsars(status);
create index idx_dsars_due on public.dsars(due_date);

-- ════════════════════════════════════════════════════════════════════
--  FEATURE FLAGS — runtime toggles
-- ════════════════════════════════════════════════════════════════════

create table public.feature_flags (
  key text primary key,
  description text,
  enabled boolean default false,
  rollout_percentage int default 0 check (rollout_percentage between 0 and 100),
  conditions jsonb default '{}'::jsonb,        -- e.g. {"subscription_tier": ["family"]}
  updated_by uuid references public.admins(id),
  updated_at timestamptz default now() not null
);

-- ════════════════════════════════════════════════════════════════════
--  A/B EXPERIMENTS
-- ════════════════════════════════════════════════════════════════════

create table public.experiments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  hypothesis text not null,
  status experiment_status default 'draft',
  variants jsonb default '[]'::jsonb,          -- [{"key": "control", "weight": 50}, ...]
  primary_metric text not null,
  started_at timestamptz,
  ended_at timestamptz,
  winner text,
  results jsonb default '{}'::jsonb,
  created_by uuid references public.admins(id),
  created_at timestamptz default now() not null
);

create index idx_experiments_status on public.experiments(status);

-- ════════════════════════════════════════════════════════════════════
--  Add admin flag to parents for impersonation tracking
-- ════════════════════════════════════════════════════════════════════

alter table public.parents add column if not exists is_suspended boolean default false;
alter table public.parents add column if not exists suspension_reason text;
alter table public.parents add column if not exists suspended_at timestamptz;
alter table public.parents add column if not exists suspended_by uuid references public.admins(id);

-- ════════════════════════════════════════════════════════════════════
--  HELPER — is_admin() function for RLS
-- ════════════════════════════════════════════════════════════════════

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.admins
    where auth_user_id = auth.uid()
      and is_active = true
  );
$$ language sql security definer stable;

create or replace function public.admin_role()
returns admin_role as $$
  select role from public.admins
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;
$$ language sql security definer stable;

-- ════════════════════════════════════════════════════════════════════
--  RLS — admins can read everything; everyone else stays scoped
-- ════════════════════════════════════════════════════════════════════

alter table public.admins enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.escalations enable row level security;
alter table public.agent_invocations enable row level security;
alter table public.tutors enable row level security;
alter table public.tutor_assignments enable row level security;
alter table public.dsars enable row level security;
alter table public.feature_flags enable row level security;
alter table public.experiments enable row level security;

-- Admins can see their own record
create policy "admins_select_self" on public.admins
  for select using (auth_user_id = auth.uid());

-- Super admins can see all admins
create policy "admins_select_all_super" on public.admins
  for select using (public.admin_role() = 'super_admin');

-- All admins can read audit log
create policy "audit_read_admins" on public.admin_audit_log
  for select using (public.is_admin());

-- All admins can read escalations
create policy "escalations_read_admins" on public.escalations
  for select using (public.is_admin());

create policy "escalations_update_admins" on public.escalations
  for update using (public.is_admin());

-- Parents can read their own escalations
create policy "escalations_read_parent" on public.escalations
  for select using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

-- Agent invocations — admins read
create policy "invocations_read_admins" on public.agent_invocations
  for select using (public.is_admin());

-- Tutors — admins manage
create policy "tutors_admin_all" on public.tutors
  for all using (public.is_admin());

create policy "tutor_assignments_admin_all" on public.tutor_assignments
  for all using (public.is_admin());

-- DSARs — admins handle, parents see their own
create policy "dsars_read_admins" on public.dsars
  for select using (public.is_admin());

create policy "dsars_update_admins" on public.dsars
  for update using (public.is_admin());

create policy "dsars_read_own" on public.dsars
  for select using (
    parent_id in (select id from public.parents where auth_user_id = auth.uid())
  );

-- Feature flags — admin write, everyone read enabled flags
create policy "flags_read_all" on public.feature_flags
  for select using (true);

create policy "flags_write_admins" on public.feature_flags
  for all using (public.is_admin());

-- Experiments — admin only
create policy "experiments_admin_all" on public.experiments
  for all using (public.is_admin());

-- Admins can read all parents/children for support purposes
create policy "parents_read_admins" on public.parents
  for select using (public.is_admin());

create policy "children_read_admins" on public.children
  for select using (public.is_admin());

-- Triggers
create trigger trg_admins_updated before update on public.admins
  for each row execute function public.set_updated_at();
create trigger trg_escalations_updated before update on public.escalations
  for each row execute function public.set_updated_at();
create trigger trg_tutors_updated before update on public.tutors
  for each row execute function public.set_updated_at();
