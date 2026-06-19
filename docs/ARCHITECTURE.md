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

## Golden Path (new-family journey)

The complete first-run flow, with the single primary CTA that carries the
parent from each step to the next. Every post-action redirect and success
screen below is wired so the chain never dead-ends:

```
signup ──► /signup/verify-sent ──► (email link) /verify
   │                                     │
   │   markEmailVerified + sign in       ▼
   └────────────────────────────►  /onboarding  (3-step overview)
                                         │ "Get started"
                                         ▼
                              /dashboard/children/new
                                         │ createChild → redirect
                                         ▼
                              /onboarding/diagnostic
                                         │ diagnostic complete → results + narrative
                                         │ primary CTA "See this week's plan"
                                         ▼
                                    /schedule  (weekly plan + reasons)
                                         │ approve (or any edit = approval)
                                         │ → post-approval "How {child} starts" card
                                         ▼
                          set parent PIN (/settings#parent-pin) ─┐
                                         │ "Open child mode"      │
                                         ▼                        │
                                     /learn  (child quests) ◄─────┘
                                         │ first lesson done
                                         ▼
                          parent's next /dashboard visit shows real
                          progress; getting-started checklist self-completes
```

Empty/cold states never strand the user: the zero-children dashboard offers
"Add your first child"; the no-child `/schedule` offers "Add a child"; the
no-lessons activity feed offers "Start the diagnostic".

### Cross-feature links (no orphan features)

- Lesson celebration (certified) → `/learn/map?highlight=<topic>` which scrolls
  to and glows the node that just lit up.
- Progress-map certified nodes show "review comes up in N days" from the
  spaced-repetition `next_review_at`.
- Trajectory empty state → "Start a mock exam" (`/learn/mock`).
- Mock result → "See my journey" (`/learn/map`) plus a next-focus line.
- Weekly-plan email → `/schedule`; escalation email + digest → `/tutoring#escalations`.
- Dashboard escalation banner → `/tutoring#escalations`, the parent-facing
  paused-lessons detail with the escalation messaging thread ready.
- Child quests reflect the approved weekly plan: today's quest per subject is
  the topic the plan assigned to today (same topic, same day as `/schedule`),
  falling back to the next uncertified topic when the plan has none for today.

## Terminology Glossary (canonical user-facing voice)

One term per concept across pages, emails, toasts and components. Future
sessions MUST comply — grep for the banned column before introducing copy.
Child mode keeps a warmer register that maps 1:1 to the parent term.

| Concept | Canonical (parent/system) | Child mode | Banned synonyms | Reserved exceptions |
|---|---|---|---|---|
| The unit a child works through | **lesson** | **quest** | session¹ | "session" only for auth/JWT (`createSession`), never the learning unit |
| The weekly set of lessons | **plan** (UI label) | — | — | route + nav path stay `/schedule`; `weekly_schedules` collection name |
| A topic reaching completion | **certified** | **mastered** | — | child mode's "mastered" is the warm 1:1 register |
| The baseline level test | **diagnostic** | — | assessment² | "Assessment Agent" (agent proper noun); marketing funnel CTA "free assessment" |
| The human who helps | **tutor** | — | teacher³ | "teacher" only in founder/marketing narrative prose, never product UI |

¹ "session" as a single sitting was swept from the dashboard (stats, activity
feed, escalation copy) in favour of "lesson". ² "assessment" survives only as
the named AI agent and the marketing funnel CTA, both deliberate. ³ "teacher"
appears in the About-page founder story by design.

Child↔parent mapping holds: the plan email's "Tuesday: Fractions" is findable
as Tuesday's quest in child mode (same topic, same day — see Cross-feature
linking).

## Route Groups (`src/app/`)

| Group | Audience | Contents |
|---|---|---|
| `(marketing)` | Public | about, agents, childrens-code, compliance, contact, cookies, demo, for-parents, gallery, how-it-works, local-authorities, pricing, privacy, resources, roadmap, safety, terms, why-now |
| `(auth)` | Public | login, logout, signup (+ verify, verify-sent), verify |
| `(dashboard)` | Parents | dashboard (children CRUD), onboarding (diagnostic), schedule, portfolio, tutoring, settings, compliance/cnis, lesson |
| `(child)` | Children | learn, learn/lesson — distraction-free lesson UI |
| `(admin)` | Staff | agents, audit, compliance, curriculum, escalations, experiments, finance, settings, tutors, users. Gated by `ParentDoc.is_admin` in the group layout (granted manually in Atlas; middleware only checks "signed in") |

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
| `parents` | ParentDoc | Account, password hash, subscription tier, billing status, Stripe customer/subscription ids (synced by `/api/billing/webhook` only), email prefs (`weekly_digest_opt_out`, `weekly_plan_email_opt_out`, `escalation_alert_opt_out`, `marketing_emails_opt_out` — toggles in `/settings`), `lifecycle_emails_sent` (idempotency keys for onboarding emails), `two_factor_enabled`, `phone` (E.164, for immediate-severity safety SMS), `is_admin` legacy staff flag + `role` ("admin" | "support" — see `lib/auth/rbac.ts`), `token_version` (session invalidation — "sign out everywhere" / password change) |
| `children` | ChildDoc | Profile, DOB, SEND indicators, target exam window, child-chosen personalisation (`voice_id`, `accent`) |
| `evaluation_records` | EvaluationDoc | Diagnostic/mock results, predicted grades |
| `instructional_logs` | LessonLogDoc | Per-lesson logs (phase, attempts, hints, mastery) |
| `lesson_progress` | LessonProgressDoc | Within-lesson autosave (interactive daily flow): one row per child per topic (`step`, `score`, `total`) so an interrupted child resumes at the exact step. Deleted on completion — a finished lesson never resumes; pedagogical state only, never analytics |
| `competence_matrix` | CompetenceDoc | Topic state: locked → training → certified; optional spaced-repetition schedule (`next_review_at`, `review_interval_days`) |
| `compliance_dossiers` | DossierDoc | Portfolio evidence with secure hash |
| `curriculum_topics` / `questions` | — | Human-authored curriculum + question bank. Each question carries an optional `key_stage` (2 = KS2, 3 = KS3, 4 = GCSE) so the diagnostic can select age-appropriate items; legacy rows without it are treated as GCSE (4). Questions may also carry an optional `interaction` (the interactive-step schema, below) and `hints` (progressive nudges); both absent ⇒ a plain mcq. The engine SELECTS by band/tier — it never generates questions, answers, hints or interactions |
| `checkins` | CheckinDoc | Daily mood → difficulty throttle |
| `media` | MediaDoc | Cloudinary registry (dedupe via content hash) |
| `weekly_schedules` | WeeklyScheduleDoc | Parent-set weekly plan; each item carries a data-grounded `reason` (competence state + latest evaluation) shown on `/schedule` — optional on legacy docs |
| `tutor_bookings` / `escalations` | — | Human safety net. Escalations carry an SLA workflow (`status` open→acknowledged→resolved, `acknowledged_at`, `resolved_at`, `staff_note` internal-only); the admin queue sorts by severity + age with live SLA timers (`lib/engine/escalation-sla.ts`), parents see only a reassuring status |
| `messages` | MessageDoc | Parent ↔ staff threads on a booking/escalation; every parent read/write filters on `parent_id` for family isolation |
| `staff_audit_log` | StaffAuditLogDoc | Append-only trail of staff WRITE actions + escalation-detail VIEWS (who, action, target, when). No update/delete repo functions exist |
| `newsletter_subscribers` | — | Public lead capture |
| `ai_invocations` | AiInvocationDoc | Per-call AI telemetry (powers admin console) |

### Ownership enforcement (critical)

Postgres RLS previously enforced the parent↔child data silo at the database level.
MongoDB has no equivalent, so **`repo.ts` enforces it in application code**: every
child-scoped query passes an ownership check (`assertOwnsChild`). All reads/writes
must go through repo functions — never call `getCollection` from route handlers
(the public `newsletter` route is the single deliberate exception).

## Interactive Daily Flow (child)

The child lesson (`(child)/learn/lesson` → `DailyFlow`: Explainer → Practice) is
actively interactive. Steps are authored as **data**, not per-problem code.

- **Problem schema** ([src/lib/child/interactions.ts](../src/lib/child/interactions.ts)):
  a discriminated union — `mcq` (default) · `tap_reveal` · `fill_blank` ·
  `drag_drop`. A question's optional `interaction` field selects the type;
  `normalizeInteraction()` validates DB rows and falls back to `mcq` for
  anything absent or malformed (legacy-safe). Answer checking
  (`checkMcq/TapReveal/FillBlank/DragDrop`), the `buildHintLadder` (nudge →
  specific → full), and resume math (`resolveResumeStep`/`clampResumeScore`) are
  **pure + deterministic** (no AI, no network) and unit-tested
  (`tests/interactions.test.ts`).
- **Renderer** ([src/components/child/interaction.tsx](../src/components/child/interaction.tsx)):
  one accent-driven `<Interaction>` used by `practice-player.tsx` (child) and
  `lesson-player.tsx` (parent preview). Every type works on touch **and**
  keyboard (drag_drop has mandatory tap-to-place + keyboard fallback), all
  targets are `.child-touch` (≥64px), and the child's chosen accent
  (`lib/child/accents.ts`) threads through every surface.
- **Feedback (calm law)**: correct = accent settle + rotating `Celebration`
  burst + an encouraging line (non-blocking); incorrect = a soft dim/desaturate
  — never red, shake, or buzzer. Up to 3 attempts then the worked solution.
  Attempts/hints are recorded on `LessonLogDoc` via the repo layer — **never
  analytics**.
- **Safety**: `fill_blank` is the only new free-text child surface, so typed
  answers are scanned by an AI-free distress gate at `POST /api/safety-check`
  (same freeze + escalate as `/api/tutor`); selection-only types need no scan.
- **Resume**: within-lesson position autosaves to `lesson_progress` (repo) +
  `localStorage` (instant same-device); the two reconcile on mount and a warm
  "Welcome back" card precedes the exact-step fade-in.
- **Focus mode** (`FocusFrame`): an active lesson fades the branding chrome and
  centres content to ≥85% of the mobile viewport; the exit + parent-gate stay
  reachable. All of the above hold under `prefers-reduced-motion` and WCAG AA.

## Quality & Monitoring

Layered bug-catching for a push-to-production setup with no staging:

1. **Unit tests (Vitest, `npm test`)** — pure high-stakes logic only, no DB or
   network: the distress matcher (`lib/safety/escalation.ts`), exam decision
   engine (`lib/engine/exam-decision.ts`), rate limiter (`lib/rate-limit.ts`),
   Stripe tier/status maps (`lib/billing/stripe.ts`), week-start date math, and
   the learning-insights engine (`lib/engine/insights.ts` — threshold/framing).
   Tests live in `tests/`; `vitest.config.ts` stubs the `server-only` package.
   Tests must pass before every push.

2. **CI (GitHub Actions, `.github/workflows/ci.yml`)** — type-check, lint,
   unit tests and a production build on every push/PR to `main`. Runs without
   secrets: the build tolerates missing env vars by design (feature keys
   degrade gracefully). Since a push to `main` *is* the production deploy,
   CI is the record of whether that deploy was built from green code.

3. **Post-deploy smoke (Playwright, `npm run smoke`)** — a tripwire that the
   *deployed* production site actually works. A `smoke` job in
   `.github/workflows/ci.yml` runs push-to-`main` only, after `checks` builds
   green, waits for `/api/health`, then runs ≤10 read-only tests against
   production (login-gated ones use the dedicated `is_smoke_account` parent set
   up via `npm run smoke:setup`; they skip without `SMOKE_*` secrets). A failure
   fails the workflow → GitHub emails the owner. Never runs on PRs.

4. **Sentry (`@sentry/nextjs`)** — runtime error capture for what slips into
   production. Configs: `src/instrumentation.ts` (server/edge),
   `src/instrumentation-client.ts`, shared scrubber in
   `lib/monitoring/sentry-shared.ts`. Unset `NEXT_PUBLIC_SENTRY_DSN` /
   `SENTRY_DSN` = fully disabled. **Privacy invariant (children's platform):**
   `sendDefaultPii: false`, the shared `beforeSend` strips user identity,
   cookies, headers, bodies, query strings and breadcrumb data; no tracing, no
   session replay. Events carry stack traces + route names, tagged
   `route_group` (marketing/auth/dashboard/child/admin/api) so child-facing
   errors are triaged first. Every runtime config must keep using the shared
   scrubber.

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
- **Theme**: the parent app (dashboard + auth) is dark by default; a `.theme-light`
  scope (globals.css, same remap technique as `.theme-warm`) flips it via a class
  on the `#hexa-workspace` wrapper. Preference is client-side (localStorage,
  `hexa-theme`), set in Settings → Appearance, with an inline no-flash script.
  Marketing is fixed-warm; child mode is fixed-light (readability + Children's
  Code) and never mounts the theme provider.
