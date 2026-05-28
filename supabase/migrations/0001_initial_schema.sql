-- ────────────────────────────────────────────────────────────────────
--  HEXA — Initial schema
--  Source: HEXA Technical Brief v1.0, Section 5
--  Region: EU West (London) — UK GDPR data residency required
-- ────────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector"; -- pgvector for Phase 2 RAG

-- ════════════════════════════════════════════════════════════════════
--  ENUMS
-- ════════════════════════════════════════════════════════════════════

create type subscription_tier as enum ('diagnostic', 'standard', 'family');
create type billing_status as enum ('trialing', 'active', 'past_due', 'canceled', 'paused');
create type academic_domain as enum ('mathematics', 'english', 'science');
create type competence_state as enum ('locked', 'training', 'certified');
create type session_status as enum ('in_progress', 'completed', 'abandoned', 'escalated');

-- ════════════════════════════════════════════════════════════════════
--  USERS REFERENCE STRUCTURE
-- ════════════════════════════════════════════════════════════════════

create table public.parents (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  subscription_tier subscription_tier default 'diagnostic',
  billing_status billing_status default 'trialing',
  trial_ends_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.children (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  send_indicators jsonb default '[]'::jsonb,
  persona_schema_json jsonb default '{}'::jsonb,
  target_exam_window text, -- e.g. "Summer 2028"
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_children_parent on public.children(parent_id);

-- ════════════════════════════════════════════════════════════════════
--  CURRICULUM SPECIFICATION ARCHITECTURE
-- ════════════════════════════════════════════════════════════════════

create table public.subject_domains (
  id uuid primary key default uuid_generate_v4(),
  academic_domain academic_domain not null,
  national_spec_reference text not null, -- e.g. "Pearson Edexcel 1MA1"
  created_at timestamptz default now() not null
);

create table public.topics (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subject_domains(id) on delete cascade,
  topic_tag text not null,
  formal_description text not null,
  pre_requisite_array uuid[] default '{}',
  difficulty_tier int default 1,
  created_at timestamptz default now() not null
);

create index idx_topics_subject on public.topics(subject_id);

create table public.academic_lessons (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  sort_order int not null,
  target_duration int not null default 45, -- minutes
  instructional_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index idx_lessons_topic on public.academic_lessons(topic_id);

-- Curriculum embeddings for RAG (Phase 2)
create table public.curriculum_embeddings (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references public.topics(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now() not null
);

create index idx_curriculum_embeddings on public.curriculum_embeddings
  using ivfflat (embedding vector_cosine_ops);

-- ════════════════════════════════════════════════════════════════════
--  PROGRESSION METRIC ENGINE
-- ════════════════════════════════════════════════════════════════════

create table public.instructional_logs (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.children(id) on delete cascade,
  lesson_id uuid not null references public.academic_lessons(id),
  status session_status default 'in_progress',
  timestamp_start timestamptz default now() not null,
  timestamp_end timestamptz,
  count_attempts int default 0,
  hints_counter int default 0,
  mastery_score numeric(5, 2),
  created_at timestamptz default now() not null
);

create index idx_logs_child on public.instructional_logs(child_id);
create index idx_logs_lesson on public.instructional_logs(lesson_id);

create table public.evaluation_records (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.children(id) on delete cascade,
  test_id uuid,
  raw_score numeric(5, 2),
  model_predicted_grade text, -- e.g. "7", "8", "9"
  confidence_interval numeric(4, 2),
  created_at timestamptz default now() not null
);

create index idx_evaluations_child on public.evaluation_records(child_id);

create table public.competence_matrix (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.children(id) on delete cascade,
  topic_id uuid not null references public.topics(id),
  state competence_state default 'locked',
  certified_at timestamptz,
  updated_at timestamptz default now() not null,
  unique (child_id, topic_id)
);

create index idx_competence_child on public.competence_matrix(child_id);

-- ════════════════════════════════════════════════════════════════════
--  STATUTORY COMPLIANCE CACHE
-- ════════════════════════════════════════════════════════════════════

create table public.compliance_dossiers (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.children(id) on delete cascade,
  reporting_period text not null, -- e.g. "2026-Q2"
  generated_at timestamptz default now() not null,
  secure_hash text not null, -- SHA-256
  statutory_dispatch_logs jsonb default '[]'::jsonb,
  pdf_storage_path text
);

create index idx_dossiers_child on public.compliance_dossiers(child_id);

create table public.external_audits (
  id uuid primary key default uuid_generate_v4(),
  portfolio_id uuid not null references public.compliance_dossiers(id) on delete cascade,
  tracking_token text unique not null,
  timestamp_access timestamptz,
  download_metric_flags jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- ════════════════════════════════════════════════════════════════════
--  TRIGGERS — updated_at automation
-- ════════════════════════════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_parents_updated before update on public.parents
  for each row execute function public.set_updated_at();
create trigger trg_children_updated before update on public.children
  for each row execute function public.set_updated_at();
create trigger trg_competence_updated before update on public.competence_matrix
  for each row execute function public.set_updated_at();
