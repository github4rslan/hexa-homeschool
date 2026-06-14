/**
 * One-time setup for the post-deploy smoke account. Run DELIBERATELY by the
 * owner — NEVER in CI. Creates (or refreshes) a dedicated parent with one child
 * and just enough seeded data for the read-only smoke suite (a name on the
 * dashboard, an approved weekly plan, a baseline evaluation). The account is
 * flagged `is_smoke_account` so it's excluded from PostHog and all lifecycle
 * emails.
 *
 *   SMOKE_EMAIL=smoke+hexa@example.com SMOKE_PASSWORD='…' npm run smoke:setup
 *
 * Reads MONGODB_URI / MONGODB_DB and SMOKE_* from the environment or .env.local.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

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

function isoMonday(now = new Date()): string {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  const fileEnv = loadEnv();
  const uri = process.env.MONGODB_URI || fileEnv.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || fileEnv.MONGODB_DB || "hexa";
  const email = (process.env.SMOKE_EMAIL || fileEnv.SMOKE_EMAIL || "").toLowerCase();
  const password = process.env.SMOKE_PASSWORD || fileEnv.SMOKE_PASSWORD || "";

  if (!uri) {
    console.error("✗ MONGODB_URI not found. Aborting.");
    process.exit(1);
  }
  if (!email || !password) {
    console.error("✗ SMOKE_EMAIL and SMOKE_PASSWORD are required. Aborting.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  try {
    const parents = db.collection("parents");
    const children = db.collection("children");
    const schedules = db.collection("weekly_schedules");
    const evaluations = db.collection("evaluation_records");

    // 1. Parent (idempotent upsert by email), flagged + email-verified.
    const passwordHash = await bcrypt.hash(password, 12);
    await parents.updateOne(
      { email },
      {
        $set: {
          email,
          password_hash: passwordHash,
          full_name: "Smoke Test",
          is_smoke_account: true,
          email_verified: true,
          subscription_tier: "standard",
          billing_status: "active",
          updated_at: now,
        },
        $setOnInsert: { created_at: now, token_version: 0 },
      },
      { upsert: true },
    );
    const parent = await parents.findOne({ email });
    const parentId = parent!._id as ObjectId;
    console.log(`✓ Smoke parent ready: ${email}`);

    // 2. One child (idempotent by parent + name).
    const childName = "Sam Smoke";
    await children.updateOne(
      { parent_id: parentId, full_name: childName },
      {
        $set: {
          parent_id: parentId,
          full_name: childName,
          date_of_birth: "2013-09-01",
          send_indicators: [],
          target_exam_window: "Summer 2028",
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );
    const child = await children.findOne({ parent_id: parentId, full_name: childName });
    const childId = child!._id as ObjectId;
    console.log(`✓ Smoke child ready: ${childName}`);

    // 3. An approved weekly plan for the current week (so /schedule has items).
    const weekStart = isoMonday(now);
    await schedules.updateOne(
      { child_id: childId, week_start: weekStart },
      {
        $set: {
          child_id: childId,
          week_start: weekStart,
          approved_by_parent: true,
          items: [
            { day: 0, subject: "mathematics", topic_tag: "maths_number_fractions", topic_title: "Fractions", status: "planned", reason: "Smoke fixture." },
            { day: 1, subject: "english", topic_tag: "english_reading_inference", topic_title: "Inference", status: "planned", reason: "Smoke fixture." },
            { day: 2, subject: "science", topic_tag: "science_biology_cells", topic_title: "Cells", status: "planned", reason: "Smoke fixture." },
          ],
          generated_at: now,
        },
      },
      { upsert: true },
    );
    console.log(`✓ Approved weekly plan ready for week ${weekStart}`);

    // 4. A baseline evaluation (so the dashboard has a predicted grade).
    const existingEval = await evaluations.findOne({ child_id: childId, mock_exam: { $ne: true } });
    if (!existingEval) {
      await evaluations.insertOne({
        child_id: childId,
        subject: "mathematics",
        raw_score: 62,
        model_predicted_grade: "5",
        mock_exam: false,
        created_at: now,
      });
      console.log("✓ Baseline evaluation inserted.");
    } else {
      console.log("✓ Baseline evaluation already present.");
    }

    console.log("\n✅ Smoke account setup complete.");
    console.log("   Add SMOKE_EMAIL and SMOKE_PASSWORD to GitHub Actions secrets.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
