import type { ObjectId } from "mongodb";

/**
 * MongoDB document shapes (replacing the former Supabase/Postgres tables).
 * Each maps 1:1 to a collection in src/lib/mongodb.ts → Collections.
 */

export type Subject = "mathematics" | "english" | "science";

export interface ParentDoc {
  _id?: ObjectId;
  email: string;
  full_name: string | null;
  password_hash: string;
  /** Email verification (Brevo). Undefined on legacy rows = treat as verified. */
  email_verified?: boolean;
  /** Weekly progress digest opt-out. Undefined/false = receives the digest. */
  weekly_digest_opt_out?: boolean;
  /** Weekly plan email opt-out. Undefined/false = receives the plan email. */
  weekly_plan_email_opt_out?: boolean;
  /** Daily progress summary opt-out. Undefined/false = receives the summary. */
  daily_summary_opt_out?: boolean;
  /**
   * Lifecycle/marketing email opt-out (welcome is transactional and ignores
   * this; the diagnostic nudge and first-plan celebration respect it).
   * Undefined/false = receives lifecycle emails.
   */
  marketing_emails_opt_out?: boolean;
  /**
   * Lifecycle emails already sent to this parent (by key, e.g. "welcome",
   * "diagnostic_nudge", "first_plan"). Append-only; guarantees each lifecycle
   * email is sent at most once.
   */
  lifecycle_emails_sent?: string[];
  /**
   * Parent activity heartbeat — the last time a valid session was seen for this
   * parent, updated at most once per hour (throttled in `currentParentId()`) so
   * it isn't a write per request. This is a PARENT signal only (never a child's)
   * and is the single trigger for the lifecycle re-engagement series: an idle
   * `last_active` starts the win-back cadence, and when it moves forward again the
   * cadence resets. Absent = never tracked (legacy / never signed in since ship).
   */
  last_active?: Date;
  /**
   * Cyclical re-engagement claim keys, one per stage actually sent, of the form
   * `"<lastActiveMs>:<stage>"`. Because the key embeds the `last_active` value the
   * series is anchored to, a NEW idle cycle (a later `last_active`) yields new
   * keys, so prior-cycle claims never block the fresh series — this is what makes
   * the sequence reset on return without ever double-sending a stage in one cycle.
   * Append-only; `$addToSet` gives the same claim-first idempotency as
   * `lifecycle_emails_sent`. Absent = no re-engagement email ever sent.
   */
  reengagement_sent?: string[];
  /**
   * Timestamp of the most recent re-engagement email — used only for min-gap
   * spacing between escalating stages within a cycle. Absent = none sent.
   */
  reengagement_last_sent_at?: Date | null;
  /**
   * Staff flag gating the (admin) routes. No self-serve path sets this —
   * granted manually in Atlas. Undefined/false = regular parent. LEGACY: kept
   * working as "admin"; new grants use `role`. See `lib/auth/rbac.ts`.
   */
  is_admin?: boolean;
  /**
   * Staff role. `admin` = full access; `support` = read admin pages + reply in
   * messaging, but no curriculum/finance/settings writes. Absent + is_admin →
   * treated as "admin" (legacy migration in code). Absent + no is_admin = not
   * staff. Granted manually in Atlas; never self-serve.
   */
  role?: "admin" | "support" | "tutor";
  /**
   * Tutor self-status (F9): whether this tutor is currently accepting new
   * sessions. Advisory only — live matching/scheduling stays deferred — surfaced
   * on the tutor's own console and to staff. Undefined = treated as available.
   */
  tutor_available?: boolean;
  /**
   * Staff-role provenance (accountability): the admin account id that last
   * granted/changed this account's staff role, and when. Absent on legacy
   * grants made by editing Atlas directly. Set by the audited admin UI.
   */
  role_granted_by?: ObjectId | null;
  role_granted_at?: Date | null;
  /**
   * Account suspension (reversible). When true, login is refused with a support
   * message; unsuspending restores access. Set only via the audited admin UI;
   * never self-serve. Absent/false = active.
   */
  suspended?: boolean;
  suspended_at?: Date | null;
  /**
   * Manual (comp/override) billing flag. True when staff set the tier/status
   * directly rather than via Stripe Checkout/webhook — surfaced in the admin UI
   * as "manual — not Stripe-synced" so billing state is never silently desynced.
   */
  billing_manual_override?: boolean;
  /**
   * Dedicated post-deploy smoke-test account. Excluded from PostHog analytics
   * and ALL lifecycle/onboarding emails so CI runs don't pollute product data
   * or send real email. Set only by `npm run smoke:setup`.
   */
  is_smoke_account?: boolean;
  /**
   * Session invalidation counter. Sessions carry it as `tv`; bumping it
   * ("sign out everywhere", password change) rejects all older sessions.
   * Undefined = 0.
   */
  token_version?: number;
  /** Escalation alert email opt-out. Undefined/false = receives alerts. */
  escalation_alert_opt_out?: boolean;
  /**
   * Event-driven milestone notifications opt-out (Wave 7, Phase 5): the warm,
   * specific mastery-achieved and inactivity-reminder emails/SMS. Undefined/false
   * = receives them. The dashboard activity feed always shows the events
   * regardless — this only governs the push. Struggle/handoff notifications keep
   * following `escalation_alert_opt_out` (they are a safety-adjacent signal).
   */
  event_notifications_opt_out?: boolean;
  /**
   * Parent mobile in E.164 (e.g. "+447700900123"), for immediate-severity
   * safety SMS alerts. Absent = no SMS (email + dashboard remain the baseline).
   */
  phone?: string | null;
  /** Bcrypt hash of the 4-digit parent gate PIN used to exit child mode. */
  parent_pin_hash?: string | null;
  /**
   * Email two-factor sign-in (opt-in). When true and Brevo is configured,
   * login requires a 6-digit emailed code after the password.
   * Undefined/false = password only.
   */
  two_factor_enabled?: boolean;
  /**
   * Authenticator-app (TOTP) two-factor sign-in (F4, opt-in). Unlike email 2FA
   * it needs no email provider. `totp_secret_enc` is the AES-256-GCM-sealed
   * shared secret (never stored in plaintext); `totp_enabled` gates the sign-in
   * step (only true once a code has been verified); `totp_recovery_hashes` are
   * SHA-256 hashes of single-use backup codes (removed as they're consumed).
   * All undefined = TOTP not set up.
   */
  totp_enabled?: boolean;
  totp_secret_enc?: string | null;
  totp_recovery_hashes?: string[];
  /**
   * Parent-feedback prompt state (voluntary sentiment widget). Drives the pure
   * eligibility function (`lib/engine/feedback-eligibility.ts`) so the milestone
   * prompt can never re-nag: `feedback_last_shown_at` (audit of when it last
   * appeared), `feedback_last_submitted_at` (long cooldown), `feedback_last_
   * dismissed_at` (short cooldown), `feedback_opt_out` ("don't ask again",
   * durable). All optional + legacy-safe (absent = never shown/actioned).
   */
  feedback_last_shown_at?: Date | null;
  feedback_last_submitted_at?: Date | null;
  feedback_last_dismissed_at?: Date | null;
  feedback_opt_out?: boolean;
  /**
   * Web Push subscriptions (F4) — one per browser/device the parent opted into
   * on-device milestone notifications. Parents-only (never registered in child
   * mode). Stored keyed by endpoint (unique), pruned automatically when a push
   * returns 404/410 (expired). Absent = no push subscriptions. VAPID keys unset
   * on the server ⇒ the whole feature is off and this stays empty.
   */
  push_subscriptions?: PushSubscriptionDoc[];
  subscription_tier: "diagnostic" | "standard" | "family";
  billing_status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  /** Stripe linkage — absent until the parent first goes through Checkout. */
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

/** A stored Web Push subscription (the browser PushSubscription, serialised). */
export interface PushSubscriptionDoc {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  created_at: Date;
}

export interface ChildDoc {
  _id?: ObjectId;
  parent_id: ObjectId;
  full_name: string;
  date_of_birth: string; // ISO date
  send_indicators: string[];
  target_exam_window: string | null;
  /** Child-chosen narration voice (one of the curated CHILD_VOICES ids). */
  voice_id?: string | null;
  /** Child-chosen child-mode accent preset id (see lib/child/accents.ts). */
  accent?: string | null;
  /**
   * Auto-read questions aloud on appearance (accessibility). Optional +
   * legacy-safe: undefined ⇒ ON (it helps the youngest and SEND learners).
   */
  narration_autoplay?: boolean;
  /**
   * Gentle sound + haptic cues on lesson controls (Wave 8). Optional +
   * legacy-safe: undefined ⇒ ON; the child can opt out in "My stuff".
   */
  sound_cues?: boolean;
  /**
   * Picture-first / low-text mode (Wave 8, Phase 3): fewer words, icon-first
   * controls, meaning never depends on reading (pairs with read-aloud).
   * Optional + legacy-safe: undefined ⇒ OFF (normal text).
   */
  low_text?: boolean;
  /**
   * SEND-aware reading supports (F3) — child-controlled in "My stuff", applied
   * to the lesson focus frame. All legacy-safe (undefined ⇒ off / normal), no
   * tracking or profiling (Children's Code).
   *   - `reading_font`  — dyslexia-friendly, well-spaced font treatment.
   *   - `text_scale`    — whole-lesson text-size multiplier (1 | 1.15 | 1.3).
   *   - `reading_ruler` — line-focus reading ruler overlay.
   */
  reading_font?: boolean;
  text_scale?: number;
  reading_ruler?: boolean;
  /**
   * When the child completed the one-time onboarding diagnostic. Set ONCE on
   * first full completion (the baseline); never overwritten. Optional +
   * legacy-safe: a child with prior non-mock evaluations but no flag is treated
   * as already completed (and back-filled). Absent/null ⇒ not yet completed.
   */
  diagnostic_completed_at?: Date | null;
  /**
   * UTC day-key ("YYYY-MM-DD") the parent's daily progress summary was last
   * sent for this child — the once-per-child-per-day idempotency guard.
   * Optional + legacy-safe: absent ⇒ none sent yet.
   */
  daily_summary_sent_on?: string;
  /**
   * A short parent → child encouragement note (F1) shown gently at the top of
   * the child hub — human-authored warmth, no AI. Length-capped (~140 chars,
   * enforced in `setChildNote`), rendered React-escaped. Optional + legacy-safe:
   * absent/empty ⇒ no card. Never used for analytics/profiling.
   */
  parent_note?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EvaluationDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  /** Which subject this result is for (was previously dropped on write). */
  subject: Subject | null;
  raw_score: number | null;
  model_predicted_grade: string | null;
  confidence_interval: number | null;
  mock_exam: boolean;
  /**
   * For mock_exam docs only: the period key (period-start ISO date) this
   * attempt counts against. Backs the unique (child_id, subject, mock_period)
   * index that enforces one attempt per subject per period. Absent on legacy
   * mocks and on all non-mock evaluations.
   */
  mock_period?: string;
  /**
   * For mock_exam docs only (F7): the mark-weighted score (0–100) and the
   * approximate, tier-derived GCSE grade computed from published-boundary
   * approximations. Parent-facing readiness context only, always labelled
   * "approximate"; never shown to the child as a pass/fail. Absent on legacy
   * mocks and all non-mock evaluations.
   */
  mock_marks_pct?: number;
  mock_boundary_grade?: string;
  created_at: Date;
}

export interface LessonLogDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  topic_tag: string;
  status: "in_progress" | "completed" | "abandoned" | "escalated";
  /** Which part of the daily flow this log is for (Stage 3). */
  phase?: "explainer" | "practice" | "mastery";
  timestamp_start: Date;
  timestamp_end: Date | null;
  count_attempts: number;
  hints_counter: number;
  mastery_score: number | null;
  created_at: Date;
}

/**
 * Within-lesson autosave (interactive daily flow). One row per child per topic,
 * letting an interrupted child resume at the exact step. Deleted on completion —
 * a finished lesson never resumes; the canonical LessonLogDoc / mastery result
 * is the durable record. Pedagogical state only — never analytics.
 */
export interface LessonProgressDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  topic_tag: string;
  /** Step the child was on (0-based). */
  step: number;
  /** Questions answered correctly so far. */
  score: number;
  /** Question count when saved (content-change guard on resume). */
  total: number;
  /**
   * Sub-phase this checkpoint was captured in (B1 fix: Mastery previously had
   * no persistence at all, so a refresh past Practice discarded the whole
   * lesson). Absent on legacy rows, which are treated as "practice".
   */
  phase?: "practice" | "mastery";
  /** Which mastery attempt this checkpoint belongs to; set only when phase === "mastery". */
  mastery_attempt?: number | null;
  /** Mastery question ids already used in earlier attempts; set only when phase === "mastery". */
  used_mastery_ids?: string[];
  updated_at: Date;
}

export interface CompetenceDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  topic_tag: string;
  state: "locked" | "training" | "certified";
  certified_at: Date | null;
  updated_at: Date;
  /**
   * Spaced-repetition review schedule (set on certification). Legacy rows with
   * these undefined are treated as due-now with a 7-day interval. A due review
   * never demotes certification — it only surfaces a warm-up.
   */
  next_review_at?: Date | null;
  review_interval_days?: number;
  /**
   * Five-attempt human handoff (Wave 7, Phase 4). When the mastery loop hits
   * the attempt cap on this concept without certifying, the topic is set aside
   * ("resting") awaiting a human tutor — NEVER demoted, failed, or marked
   * against the child. The syllabus pauses it (excluded from today's quests)
   * until a tutor session is logged. Cleared (back to null) when the session is
   * logged. Optional + legacy-safe: absent/null ⇒ not paused.
   */
  tutor_paused_at?: Date | null;
  /**
   * The tutor's note from a logged handoff session. Fed to the NEXT explanation
   * for this topic ("a tip from your tutor"), wiring the human → AI data path.
   * Absent until a session is logged.
   */
  tutor_note?: string | null;
  /** When the tutor session note was logged (the moment the pause lifts). */
  tutor_session_at?: Date | null;
}

export interface CheckinDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  /** 1 (low) … 5 (great) — drives a small difficulty throttle for the day. */
  mood: number;
  /** -1 | 0 | +1 starting-tier nudge derived from mood. */
  difficulty_delta: number;
  created_at: Date;
}

export interface DossierDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  reporting_period: string;
  secure_hash: string;
  generated_at: Date;
  /** Cloudinary media ids attached as evidence (Stage 4). */
  evidence_media_ids?: ObjectId[];
}

// ── Stage 4: Cloudinary media registry ───────────────────────

export type MediaUseCase =
  | "marketing"
  | "child_work"
  | "lesson_audio"
  | "question_visual"
  | "resource";

/**
 * A Checker-PASSED agentic teaching animation, cached by question+band
 * content hash (Wave 8, Phase 2) so a tailored explanation is generated once.
 * Only verified payloads are ever stored — the cache can never replay an
 * unchecked model output. Question-scoped; carries no child data.
 */
export interface AiAnimationDoc {
  _id?: ObjectId;
  /** sha256 of prompt + canonical answer + key stage + prompt version. */
  content_hash: string;
  /** The validated TeachingAnimation payload (shape-checked before insert). */
  animation: Record<string, unknown>;
  key_stage?: number;
  model: string;
  created_at: Date;
}

export interface MediaDoc {
  _id?: ObjectId;
  owner_id: ObjectId | null; // parent who uploaded (null for system/admin)
  child_id?: ObjectId | null;
  use_case: MediaUseCase;
  folder: string;
  public_id: string;
  secure_url: string;
  resource_type: "image" | "video" | "raw";
  is_public: boolean;
  /** For dedupe/caching (e.g. TTS text+voice hash). */
  content_hash?: string;
  meta?: Record<string, string>;
  created_at: Date;
}

// ── Stage 1: Curriculum + question bank ──────────────────────

export interface CurriculumTopicDoc {
  _id?: ObjectId;
  subject: Subject;
  /** Stable unique key used across questions, logs, competence. */
  topic_tag: string;
  title: string;
  summary: string;
  /** UK key stage (e.g. 3 or 4). */
  key_stage: number;
  /** GCSE working-grade band this topic sits in, e.g. "Grade 4–5". */
  working_grade_band: string;
  /** Ordering within the subject sequence. */
  order: number;
  /** topic_tags that should be mastered first. */
  prerequisite_tags: string[];
  /**
   * Optional human-authored teach-first worked example. Legacy-safe: topics
   * without it keep the summary + points explainer.
   */
  worked_example?: unknown;
  /**
   * Optional human-authored tap-to-define glossary for this topic (F9 — SEND /
   * EAL). Each `{ term, definition }` is child-voice curriculum content; the
   * model never authors it (same rule as questions/answers). Matched in the
   * explainer prose by `lib/child/glossary.ts`. Legacy-safe: absent ⇒ plain
   * text, no glossary chips.
   */
  glossary?: { term: string; definition: string }[];
  created_at: Date;
}

export interface QuestionDoc {
  _id?: ObjectId;
  topic_tag: string;
  subject: Subject;
  /** 1 (easiest) … 5 (hardest); loosely maps to working grade. */
  tier: number;
  /**
   * UK key stage this item's difficulty sits in: 2 (KS2), 3 (KS3), 4 (GCSE).
   * Optional + legacy-safe: rows without it are treated as 4 (GCSE) by the
   * diagnostic pool query. Drives age-appropriate diagnostic selection.
   */
  key_stage?: number;
  /**
   * `stretch` (F6): an optional, human-authored harder bonus question offered
   * ONLY after a topic is certified. Purely celebratory — never scored, never
   * part of the mastery set, and never AI-authored. Absent ⇒ no brain-stretch
   * offer for that topic.
   */
  kind: "diagnostic" | "practice" | "mastery" | "stretch";
  prompt: string;
  options: string[];
  correct_index: number;
  /** Human-authored canonical explanation (also the offline fallback). */
  explanation: string;
  /**
   * Optional interactive step definition (Feature 1: tap_reveal / fill_blank /
   * drag_drop / mcq). Absent ⇒ renders as `mcq` from options/correct_index, so
   * legacy rows are untouched. Validated via `normalizeInteraction` on read.
   * Stored as the discriminated union in `lib/child/interactions.ts`; typed as
   * `unknown` here to keep that schema out of the DB layer.
   */
  interaction?: unknown;
  /**
   * Optional human-authored progressive hints (nudge → specific). The full
   * worked rung always falls back to `explanation`. AI never authors these.
  */
  hints?: string[];
  /**
   * Optional human-authored, per-option misconception hints (Wave 7, Phase 3).
   * Index-aligned with `options`: `misconceptions[i]` is the short, supportive
   * line shown when the child picks the WRONG option `i` ("looks like you
   * multiplied instead of divided — let's see why"). The correct option's slot
   * is ignored. Sparse arrays are fine — a missing/empty entry just means no
   * targeted line for that distractor (the generic adaptive feedback shows
   * instead). Legacy-safe (absent ⇒ no targeted hints). AI never authors these.
   */
  misconceptions?: string[];
  /**
   * Optional human-authored step-by-step solution for this exact question.
   * Used after a miss; absent rows fall back to the canonical explanation.
   */
  worked_solution?: unknown;
  /**
   * Optional human-authored teaching animation data. The child renderer validates
   * it and falls back to a deterministic animation when absent, so bad authoring
   * can never break a lesson.
   */
  teaching_animation?: unknown;
  created_at: Date;
}

// ── Stage 5: Parent control loops + safety ───────────────────

export interface ScheduleItemDoc {
  day: number; // 0 (Mon) … 6 (Sun)
  subject: Subject;
  topic_tag: string;
  topic_title: string;
  status: "planned" | "done";
  /**
   * Parent-facing, data-grounded explanation of why this topic was picked
   * (competence state + latest evaluation). Absent on legacy schedule docs.
   */
  reason?: string;
}

export interface WeeklyScheduleDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  week_start: string; // ISO date (Monday)
  items: ScheduleItemDoc[];
  approved_by_parent: boolean;
  generated_at: Date;
}

export interface TutorBookingDoc {
  _id?: ObjectId;
  parent_id: ObjectId;
  child_id: ObjectId;
  assigned_tutor_id?: ObjectId | null;
  subject: Subject | null;
  /** Optional topic context for automated support requests. */
  topic_tag?: string;
  topic_title?: string;
  source?: "parent" | "remediation";
  note: string;
  requested_slot: string; // free-text preferred time for Phase 1
  scheduled_at?: Date | null;
  duration_minutes?: number | null;
  video_provider?: "jitsi";
  video_room_name?: string | null;
  tutor_note?: string | null;
  completed_at?: Date | null;
  status: "requested" | "scheduled" | "completed" | "cancelled";
  created_at: Date;
}

/**
 * Parent ↔ staff message in a thread. Threads are scoped to a booking or an
 * escalation; a parent only ever sees their own threads (enforced by parent_id
 * filter in every repo read). Plain text only in Phase 1.
 */
export interface MessageDoc {
  _id?: ObjectId;
  thread_type: "booking" | "escalation";
  /** The booking id or escalation id this thread hangs off (hex string). */
  thread_id: string;
  parent_id: ObjectId;
  child_id: ObjectId;
  sender: "parent" | "staff";
  body: string; // ≤ 2000 chars
  created_at: Date;
  read_at: Date | null;
}

/**
 * One row per real AI agent invocation. Powers the admin Agent Telemetry
 * console with genuine counts/cost/latency (no fabricated figures).
 * Written best-effort — logging must never break a tutoring response.
 */
export interface AiInvocationDoc {
  _id?: ObjectId;
  /** Which agent ran: "Teaching" | "Meta Checker" | future agents. */
  agent: string;
  model: string;
  /** Tokens consumed (prompt + completion) as reported by the provider. */
  tokens: number;
  /** Wall-clock latency of the provider call, milliseconds. */
  latency_ms: number;
  /** True when the checker rejected output (the call was "blocked"). */
  blocked: boolean;
  /** Short machine reason, e.g. checker reject reason. Never child PII. */
  reason?: string;
  created_at: Date;
}

export interface EscalationDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  trigger: string;
  severity: "immediate" | "critical" | "high" | "medium" | "low";
  matched_text: string;
  /** The specific distress phrase that fired (audit detail; optional/legacy). */
  phrase?: string;
  status: "open" | "acknowledged" | "resolved";
  created_at: Date;
  /** SLA workflow (optional; legacy rows = open/unset). */
  acknowledged_at?: Date | null;
  resolved_at?: Date | null;
  /** Internal staff note — NEVER shown to parents. */
  staff_note?: string | null;
}

/**
 * Wave 7, Phase 5 — a parent-facing milestone event. One row per notable moment
 * in a child's learning (a topic mastered, a five-attempt handoff, an
 * inactivity nudge), created deterministically from the child's OWN record — no
 * AI, no profiling, no analytics. It powers two things at once: the dashboard
 * activity feed (always visible) and the once-per-event email/SMS push
 * (opt-out-gated). `dedupe_key` is unique per parent so a moment is recorded and
 * notified at most once. Child name/topic are denormalised snapshots so the feed
 * renders without re-joining. Parent-scoped; ownership enforced in repo.ts.
 */
export interface ParentEventDoc {
  _id?: ObjectId;
  parent_id: ObjectId;
  child_id: ObjectId;
  /** Snapshot of the child's full name at event time (feed rendering). */
  child_name: string;
  type:
    | "mastery"
    | "handoff"
    | "inactivity"
    | "reflection"
    | "band_promotion";
  /**
   * Human topic title for mastery/handoff events; absent for inactivity. For a
   * "reflection" (F5) this carries the warm parent-feed line, e.g. "Ada felt
   * faster today". For a "band_promotion" it carries the warm parent-facing
   * subject+stage phrase, e.g. "Science, now at lower-secondary level".
   */
  topic_title?: string | null;
  subject?: Subject | null;
  /** Mastery only: how many attempts it took to certify (≥ 1). */
  attempts?: number | null;
  /** Idempotency key, unique per (parent_id, dedupe_key). */
  dedupe_key: string;
  created_at: Date;
}

/**
 * Voluntary parent sentiment: one row per feedback submission (a required 1–5
 * star rating + an optional free-text comment). Parent-scoped and ownership-safe
 * by construction — always written with the session parent's own id, never a
 * child's. `parent_name`/`parent_email` are contact snapshots so admin staff can
 * follow up on a low rating without re-joining (minimum PII, contact only). The
 * comment is sanitized on write and rendered XSS-safe (React-escaped) on the
 * admin side. NO child data is ever stored here. See the Children's Code note:
 * this feature is parent-side only and never runs in `(child)` routes.
 */
export interface FeedbackDoc {
  _id?: ObjectId;
  parent_id: ObjectId;
  /** Contact snapshot for staff follow-up (name may be null on the account). */
  parent_name: string | null;
  parent_email: string;
  /** Required rating, 1 (unhappy) … 5 (delighted). */
  stars: number;
  /** Optional comment, sanitized + capped (≤ 1000 chars). Null when omitted. */
  comment: string | null;
  /** What surfaced the prompt: a milestone ("first_week"/"mastery") or "manual". */
  trigger: "first_week" | "mastery" | "manual";
  /** Optional page/path the feedback was given from (context only, no PII). */
  context?: string | null;
  created_at: Date;
}

/**
 * One row per re-engagement (win-back / upsell) email actually sent — the honest
 * measurement backbone for the admin panel. Parent-scoped; carries no child data.
 * `stage` (1–3) + `track` ("upsell" for free/lapsed, "reengage" for paid-active)
 * are the segmentation dimensions; `reactivate_by` is the deadline within which a
 * subsequent `last_active` advance counts as a re-activation attributable to this
 * send (the KPI). Written best-effort after a successful send; never blocks the
 * cron. Cascaded on family erasure.
 */
export interface ReengagementEventDoc {
  _id?: ObjectId;
  parent_id: ObjectId;
  stage: 1 | 2 | 3;
  track: "upsell" | "reengage";
  /** Contact/segment snapshot (no child PII) for admin follow-up + breakdowns. */
  tier: ParentDoc["subscription_tier"];
  billing_status: ParentDoc["billing_status"];
  /** The parent's `last_active` at send time — the idle cycle this send targeted. */
  idle_since: Date;
  sent_at: Date;
  /** sent_at + attribution window; a later `last_active` before this = re-activated. */
  reactivate_by: Date;
}

/**
 * Append-only audit trail of staff actions. One row per staff WRITE, plus
 * escalation-detail VIEWS (viewing a child's distress data is itself sensitive).
 * No update/delete repo functions exist for this collection.
 */
export interface StaffAuditLogDoc {
  _id?: ObjectId;
  staff_id: ObjectId;
  staff_email: string;
  /** e.g. "escalation.acknowledge", "staff.role.grant", "family.delete". */
  action: string;
  /** Canonical collection the action targeted, when applicable. */
  target_collection?: string | null;
  target_id?: string | null;
  /**
   * Operator-supplied justification. REQUIRED for every privileged family/staff
   * mutation (role change, tier change, suspend, delete); optional for the
   * lower-risk escalation transitions that predate it.
   */
  reason?: string | null;
  /** Human-readable before → after snapshot of the changed field(s). */
  before?: string | null;
  after?: string | null;
  /** Best-effort request IP (accountability); never used to profile a child. */
  ip?: string | null;
  created_at: Date;
}
