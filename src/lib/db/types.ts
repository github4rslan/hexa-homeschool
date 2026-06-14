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
  /** Email verification (Resend). Undefined on legacy rows = treat as verified. */
  email_verified?: boolean;
  /** Weekly progress digest opt-out. Undefined/false = receives the digest. */
  weekly_digest_opt_out?: boolean;
  /** Weekly plan email opt-out. Undefined/false = receives the plan email. */
  weekly_plan_email_opt_out?: boolean;
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
   * Staff flag gating the (admin) routes. No self-serve path sets this —
   * granted manually in Atlas. Undefined/false = regular parent.
   */
  is_admin?: boolean;
  /**
   * Session invalidation counter. Sessions carry it as `tv`; bumping it
   * ("sign out everywhere", password change) rejects all older sessions.
   * Undefined = 0.
   */
  token_version?: number;
  /** Escalation alert email opt-out. Undefined/false = receives alerts. */
  escalation_alert_opt_out?: boolean;
  /** Bcrypt hash of the 4-digit parent gate PIN used to exit child mode. */
  parent_pin_hash?: string | null;
  /**
   * Email two-factor sign-in (opt-in). When true and Brevo is configured,
   * login requires a 6-digit emailed code after the password.
   * Undefined/false = password only.
   */
  two_factor_enabled?: boolean;
  subscription_tier: "diagnostic" | "standard" | "family";
  billing_status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  /** Stripe linkage — absent until the parent first goes through Checkout. */
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: Date;
  updated_at: Date;
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
  | "resource";

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
  created_at: Date;
}

export interface QuestionDoc {
  _id?: ObjectId;
  topic_tag: string;
  subject: Subject;
  /** 1 (easiest) … 5 (hardest); loosely maps to working grade. */
  tier: number;
  kind: "diagnostic" | "practice" | "mastery";
  prompt: string;
  options: string[];
  correct_index: number;
  /** Human-authored canonical explanation (also the offline fallback). */
  explanation: string;
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
  subject: Subject | null;
  note: string;
  requested_slot: string; // free-text preferred time for Phase 1
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
  status: "open" | "acknowledged" | "resolved";
  created_at: Date;
}
