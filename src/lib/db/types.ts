import type { ObjectId } from "mongodb";

/**
 * MongoDB document shapes (replacing the former Supabase/Postgres tables).
 * Each maps 1:1 to a collection in src/lib/mongodb.ts → Collections.
 */

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

export interface DossierDoc {
  _id?: ObjectId;
  child_id: ObjectId;
  reporting_period: string;
  secure_hash: string;
  generated_at: Date;
}
