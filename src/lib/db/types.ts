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
  subscription_tier: "diagnostic" | "standard" | "family";
  billing_status: "trialing" | "active" | "past_due" | "canceled" | "paused";
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
