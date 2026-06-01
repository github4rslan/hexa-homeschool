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
const dbName = process.env.MONGODB_DB || "humora";

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
} as const;
