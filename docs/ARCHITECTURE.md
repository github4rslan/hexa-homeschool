# Architecture

[← README](../README.md)

## High-Level Flow

```
Visitor ──► (marketing) ──► (auth) signup + email verify
                                 │
Parent  ──► (dashboard) ─ children, schedule, portfolio, tutoring, compliance
                │
                └─ active child cookie ──► (child)/learn ─ daily lesson flow
                                                │
                                                ├─► /api/tutor  (Teaching Agent + Checker)
                                                ├─► /api/tts    (ElevenLabs narration)
                                                └─► safety gate (distress → freeze + escalate)
Staff   ──► (admin) ─ agents telemetry, audit, curriculum, finance, escalations
```

## Route Groups (`src/app/`)

| Group | Audience | Contents |
|---|---|---|
| `(marketing)` | Public | about, agents, childrens-code, compliance, contact, cookies, demo, for-parents, gallery, how-it-works, local-authorities, pricing, privacy, resources, roadmap, safety, terms, why-now |
| `(auth)` | Public | login, logout, signup (+ verify, verify-sent), verify |
| `(dashboard)` | Parents | dashboard (children CRUD), onboarding (diagnostic), schedule, portfolio, tutoring, settings, compliance/cnis, lesson |
| `(child)` | Children | learn, learn/lesson — distraction-free lesson UI |
| `(admin)` | Staff | agents, audit, compliance, curriculum, escalations, experiments, finance, settings, tutors, users |

## Library Domains (`src/lib/`)

| Domain | Files | Responsibility |
|---|---|---|
| db | `mongodb.ts`, `db/repo.ts`, `db/types.ts` | Pooled client, canonical `Collections` map, the **only** data-access layer, document shapes |
| auth | `auth/session.ts`, `auth/password.ts`, `auth/middleware.ts` | JWT sessions (HS256, `hexa_session` httpOnly cookie, 7-day expiry), bcrypt hashing |
| ai | `ai/config.ts`, `ai/teaching-agent.ts` | OpenAI config + thresholds, Teaching Agent + Checker pipeline |
| safety | `safety/escalation.ts` | Distress-phrase matcher → freeze, log, notify parent |
| engine | `engine/exam-decision.ts` | Pure deterministic exam-path engine (age 13+, Paths A–D) |
| compliance | `compliance/portfolio.ts` | Verified portfolio / dossier generation with secure hash |
| media | `media/cloudinary.ts` | Signed uploads, media registry |
| email | `email/send.ts`, `email/templates.ts`, `email/verification.ts` | Brevo transactional email |
| billing | `billing/stripe.ts` | Stripe client + tier↔price↔status mapping; checkout/portal/webhook routes under `api/billing/` |
| data | `data/*.ts` | Static content: curriculum seed, diagnostic, navigation, roadmap, safety copy |

## Data Model (MongoDB)

Collection names live in `Collections` in [src/lib/mongodb.ts](../src/lib/mongodb.ts);
document shapes in [src/lib/db/types.ts](../src/lib/db/types.ts). The seed script
(`npm run seed`) owns all indexes.

| Collection | Doc | Purpose |
|---|---|---|
| `parents` | ParentDoc | Account, password hash, subscription tier, billing status, Stripe customer/subscription ids (synced by `/api/billing/webhook` only) |
| `children` | ChildDoc | Profile, DOB, SEND indicators, target exam window |
| `evaluation_records` | EvaluationDoc | Diagnostic/mock results, predicted grades |
| `instructional_logs` | LessonLogDoc | Per-lesson logs (phase, attempts, hints, mastery) |
| `competence_matrix` | CompetenceDoc | Topic state: locked → training → certified |
| `compliance_dossiers` | DossierDoc | Portfolio evidence with secure hash |
| `curriculum_topics` / `questions` | — | Human-authored curriculum + question bank |
| `checkins` | CheckinDoc | Daily mood → difficulty throttle |
| `media` | MediaDoc | Cloudinary registry (dedupe via content hash) |
| `weekly_schedules` | WeeklyScheduleDoc | Parent-set weekly plan; each item carries a data-grounded `reason` (competence state + latest evaluation) shown on `/schedule` — optional on legacy docs |
| `tutor_bookings` / `escalations` | — | Human safety net |
| `newsletter_subscribers` | — | Public lead capture |
| `ai_invocations` | AiInvocationDoc | Per-call AI telemetry (powers admin console) |

### Ownership enforcement (critical)

Postgres RLS previously enforced the parent↔child data silo at the database level.
MongoDB has no equivalent, so **`repo.ts` enforces it in application code**: every
child-scoped query passes an ownership check (`assertOwnsChild`). All reads/writes
must go through repo functions — never call `getCollection` from route handlers
(the public `newsletter` route is the single deliberate exception).

## Supabase Migration (historical)

The project began on Supabase (Postgres + RLS + Supabase Auth) and was fully
migrated to MongoDB + custom JWT auth. The `supabase/` directory and all
`@supabase/*` / `supabase` packages have been removed. Comments referencing
Postgres/RLS are kept where they explain *why* the application-level ownership
checks exist.

## Cross-Cutting Conventions

- **Server-only modules** declare `import "server-only"` (db, auth, ai).
- **Graceful degradation**: missing API keys throw typed errors (`AiConfigError`,
  `MediaConfigError`) surfaced as clean 503s; unset Brevo = signups auto-verify.
- **Active child**: the parent selects an active child; child-facing routes and
  `/api/tutor` resolve it via `lib/active-child.ts` (cookie).
- **Db name**: `mongodb.ts` falls back to db name `"hexa"` if `MONGODB_DB` is
  unset — still set it explicitly in every environment.
