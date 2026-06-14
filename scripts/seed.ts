/**
 * HEXA database seed — curriculum topics, question bank, and indexes.
 *
 * Idempotent: upserts on natural keys, so it is safe to re-run after editing
 * src/lib/data/curriculum.seed.ts. Also creates all indexes (including for the
 * Stage-4 `media` collection) so index ownership lives in one place.
 *
 * Usage:
 *   npm run seed
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local (no dotenv dependency).
 * Run with the bundled tsx loader (see package.json "seed" script).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { SEED_TOPICS, SEED_QUESTIONS } from "../src/lib/data/curriculum.seed";
import { SEED_QUESTIONS_EXTRA } from "../src/lib/data/curriculum.seed.extra";

const ALL_QUESTIONS = [...SEED_QUESTIONS, ...SEED_QUESTIONS_EXTRA];

function loadEnv(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const env: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

async function main() {
  const fileEnv = loadEnv();
  const uri = process.env.MONGODB_URI || fileEnv.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || fileEnv.MONGODB_DB || "hexa";

  if (!uri) {
    console.error("✗ MONGODB_URI not found (env or .env.local). Aborting.");
    process.exit(1);
  }

  console.log(`→ Connecting to MongoDB database "${dbName}"…`);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  try {
    const now = new Date();

    // ── Topics ──
    const topicsCol = db.collection("curriculum_topics");
    let topicUpserts = 0;
    for (const t of SEED_TOPICS) {
      const res = await topicsCol.updateOne(
        { topic_tag: t.topic_tag },
        { $set: { ...t }, $setOnInsert: { created_at: now } },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) topicUpserts++;
    }
    console.log(`✓ Topics: ${SEED_TOPICS.length} processed (${topicUpserts} written).`);

    // ── Questions ──
    // Natural key = topic_tag + prompt (prompts are unique within a topic).
    const questionsCol = db.collection("questions");
    let qUpserts = 0;
    for (const q of ALL_QUESTIONS) {
      const res = await questionsCol.updateOne(
        { topic_tag: q.topic_tag, prompt: q.prompt },
        { $set: { ...q }, $setOnInsert: { created_at: now } },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) qUpserts++;
    }
    console.log(`✓ Questions: ${ALL_QUESTIONS.length} processed (${qUpserts} written).`);

    // ── Indexes ──
    console.log("→ Ensuring indexes…");
    await topicsCol.createIndex({ topic_tag: 1 }, { unique: true });
    await topicsCol.createIndex({ subject: 1, order: 1 });

    await questionsCol.createIndex({ topic_tag: 1, kind: 1, tier: 1 });
    await questionsCol.createIndex({ subject: 1, kind: 1 });

    // Child-scoped progress indexes (recent-first reads).
    await db.collection("instructional_logs").createIndex({ child_id: 1, timestamp_start: -1 });
    await db.collection("evaluation_records").createIndex({ child_id: 1, created_at: -1 });
    await db.collection("competence_matrix").createIndex({ child_id: 1, topic_tag: 1 }, { unique: true });
    await db.collection("compliance_dossiers").createIndex({ child_id: 1, generated_at: -1 });
    await db.collection("children").createIndex({ parent_id: 1, created_at: -1 });
    await db.collection("parents").createIndex({ email: 1 }, { unique: true });
    // Stripe webhook lookups; partial so parents who never checked out are excluded.
    await db.collection("parents").createIndex(
      { stripe_customer_id: 1 },
      { unique: true, partialFilterExpression: { stripe_customer_id: { $type: "string" } } },
    );

    // Stage 4 media registry (owner + use-case lookups).
    await db.collection("media").createIndex({ owner_id: 1, use_case: 1 });
    await db.collection("media").createIndex({ use_case: 1, is_public: 1 });
    await db.collection("media").createIndex({ content_hash: 1 });

    // Stage 3 check-ins + Stage 5 control loops + safety.
    await db.collection("checkins").createIndex({ child_id: 1, created_at: -1 });
    await db.collection("weekly_schedules").createIndex({ child_id: 1, week_start: 1 }, { unique: true });
    await db.collection("tutor_bookings").createIndex({ parent_id: 1, created_at: -1 });
    await db.collection("escalations").createIndex({ child_id: 1, status: 1, created_at: -1 });

    // Stage 6 newsletter (unique email).
    await db.collection("newsletter_subscribers").createIndex({ email: 1 }, { unique: true });

    // AI telemetry — queried by time window + grouped by agent.
    await db.collection("ai_invocations").createIndex({ created_at: -1 });
    await db.collection("ai_invocations").createIndex({ agent: 1, created_at: -1 });

    // Parent ↔ staff messaging: thread reads, parent isolation, unread badge.
    await db.collection("messages").createIndex({ thread_type: 1, thread_id: 1, created_at: 1 });
    await db.collection("messages").createIndex({ parent_id: 1, sender: 1, read_at: 1 });

    console.log("✓ Indexes ensured.");
    console.log("\n✅ Seed complete.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
