import "server-only";
import { MongoClient, type Db, type Collection, type Document } from "mongodb";

/**
 * Pooled MongoDB connection.
 *
 * In dev, the client is cached on globalThis so Next.js hot-reloads don't open
 * a new connection on every change. In production a single module-scoped client
 * is reused across invocations.
 *
 * NOTE (compliance): the project brief mandates UK data residency for children's
 * personal data. MongoDB Atlas clusters are not guaranteed UK-hosted — confirm
 * the cluster region meets your residency requirements before going live with
 * real users. This was a deliberate, owner-approved choice to use MongoDB.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "hexa";

if (!uri) {
  // Defer throwing until first use so build/SSG of static pages doesn't fail.
  console.warn("[mongodb] MONGODB_URI is not set; database calls will fail.");
}

let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(
      new Error(
        "MONGODB_URI is not set. Add it to .env.local (and Vercel) to enable the database.",
      ),
    );
  }

  const globalForMongo = globalThis as unknown as {
    _hexaMongoClientPromise?: Promise<MongoClient>;
  };

  if (process.env.NODE_ENV === "development") {
    if (!globalForMongo._hexaMongoClientPromise) {
      globalForMongo._hexaMongoClientPromise = new MongoClient(uri).connect();
    }
    return globalForMongo._hexaMongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

/** Typed collection accessor. */
export async function getCollection<T extends Document = Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

/** Canonical collection names (mirror the former Supabase tables). */
export const Collections = {
  parents: "parents",
  children: "children",
  evaluations: "evaluation_records",
  lessonLogs: "instructional_logs",
  competence: "competence_matrix",
  dossiers: "compliance_dossiers",
  // Interactive daily flow — within-lesson autosave so a child resumes mid-lesson
  lessonProgress: "lesson_progress",
  // Stage 1 — real curriculum + question bank
  topics: "curriculum_topics",
  questions: "questions",
  // Stage 3 — daily check-in mood log
  checkins: "checkins",
  // Stage 4 — media registry (registered here so the seed script owns all indexes)
  media: "media",
  // Stage 5 — parent control loops + safety
  schedules: "weekly_schedules",
  tutorBookings: "tutor_bookings",
  escalations: "escalations",
  // Stage 6 — public lead capture
  newsletter: "newsletter_subscribers",
  // AI telemetry — one row per real agent invocation (powers admin console)
  aiInvocations: "ai_invocations",
  // Wave 8, Phase 2 — Checker-PASSED agentic teaching animations, cached per
  // question+band content hash so each tailored explanation is generated once.
  // Question-scoped (no child data) — like `media`, not a child-siloed table.
  aiAnimations: "ai_animations",
  // Parent ↔ staff messaging threads (booking + escalation)
  messages: "messages",
  // Operations — append-only audit trail of staff WRITE actions + sensitive views
  staffAuditLog: "staff_audit_log",
  // Wave 7, Phase 5 — parent engagement: event-driven milestone feed + dedupe
  parentEvents: "parent_events",
  // Lifecycle re-engagement (win-back / upsell) — one row per send, for the
  // admin measurement panel (sends by stage/segment, re-activation, unsubscribe).
  reengagementEvents: "reengagement_events",
  // Operations — persisted app settings (feature flags), a single fixed doc
  settings: "app_settings",
  // Parent sentiment: voluntary star + comment feedback (parent-scoped). Powers
  // the admin sentiment view. NEVER written for/by a child.
  feedback: "feedback",
} as const;
