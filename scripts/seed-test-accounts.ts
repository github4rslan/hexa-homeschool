/**
 * Edway test-account seed — provisions the dedicated accounts the `scout` agent
 * uses to log in and explore the authenticated surfaces with Playwright.
 *
 * Creates / refreshes THREE accounts (idempotent upsert by email), all
 * email-verified and flagged `is_smoke_account` (excluded from PostHog + all
 * lifecycle emails), reusing the normal parent-doc auth model:
 *
 *   PARENT  (SMOKE_EMAIL / SMOKE_PASSWORD)  — normal parent, active subscription,
 *           TWO children, an approved weekly plan and a baseline evaluation, plus
 *           a known child-mode PIN (SMOKE_PARENT_PIN, default 1234).
 *   ADMIN   (ADMIN_EMAIL / ADMIN_PASSWORD)  — role: "admin".
 *   TUTOR   (TUTOR_EMAIL / TUTOR_PASSWORD)  — role: "tutor".
 *
 * Nothing secret is committed: all creds come from the environment / .env.local
 * (this repo is public). The plaintext passwords/PIN are never printed.
 *
 * Usage (creds already in .env.local):  npm run seed:test-accounts
 *
 * Touches the LIVE db that MONGODB_URI points at — run it deliberately. To remove
 * the accounts later, use scripts/delete-users.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const ROUNDS = 12; // matches src/lib/auth/password.ts

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
  const pick = (k: string) => process.env[k] || fileEnv[k] || "";
  const uri = pick("MONGODB_URI");
  const dbName = pick("MONGODB_DB") || "hexa";

  const parentEmail = pick("SMOKE_EMAIL").trim().toLowerCase();
  const parentPassword = pick("SMOKE_PASSWORD");
  const adminEmail = pick("ADMIN_EMAIL").trim().toLowerCase();
  const adminPassword = pick("ADMIN_PASSWORD");
  const tutorEmail = pick("TUTOR_EMAIL").trim().toLowerCase();
  const tutorPassword = pick("TUTOR_PASSWORD");
  const parentPin = pick("SMOKE_PARENT_PIN") || "1234";

  if (!uri) {
    console.error("✗ MONGODB_URI not found (env or .env.local). Aborting.");
    process.exit(1);
  }
  const missing = [
    ["SMOKE_EMAIL", parentEmail],
    ["SMOKE_PASSWORD", parentPassword],
    ["ADMIN_EMAIL", adminEmail],
    ["ADMIN_PASSWORD", adminPassword],
    ["TUTOR_EMAIL", tutorEmail],
    ["TUTOR_PASSWORD", tutorPassword],
  ].filter(([, v]) => !v);
  if (missing.length) {
    console.error(
      `✗ Missing creds: ${missing.map(([k]) => k).join(", ")}. Aborting.`,
    );
    process.exit(1);
  }

  const now = new Date();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  try {
    const parents = db.collection("parents");
    const children = db.collection("children");
    const schedules = db.collection("weekly_schedules");
    const evaluations = db.collection("evaluation_records");

    // ── 1. PARENT (normal), verified + smoke-flagged, active subscription ──
    await parents.updateOne(
      { email: parentEmail },
      {
        $set: {
          email: parentEmail,
          password_hash: await bcrypt.hash(parentPassword, ROUNDS),
          parent_pin_hash: await bcrypt.hash(parentPin, ROUNDS),
          full_name: "Scout Parent",
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
    const parent = await parents.findOne({ email: parentEmail });
    const parentId = parent!._id as ObjectId;
    console.log(`✓ Parent ready: ${parentEmail} (child-mode PIN set)`);

    // ── 2. Two children (idempotent by parent + name) ──
    const kids = [
      {
        full_name: "Sam Test",
        date_of_birth: "2013-09-01", // ~KS3
        send_indicators: [] as string[],
        target_exam_window: "Summer 2028",
      },
      {
        full_name: "Ivy Test",
        date_of_birth: "2016-05-10", // ~primary / KS2
        send_indicators: ["dyslexia"], // exercises SEND-aware surfaces
        target_exam_window: "Summer 2031",
      },
    ];
    const childIds: ObjectId[] = [];
    for (const kid of kids) {
      await children.updateOne(
        { parent_id: parentId, full_name: kid.full_name },
        {
          $set: { parent_id: parentId, ...kid, updated_at: now },
          $setOnInsert: { created_at: now },
        },
        { upsert: true },
      );
      const doc = await children.findOne({ parent_id: parentId, full_name: kid.full_name });
      childIds.push(doc!._id as ObjectId);
      console.log(`✓ Child ready: ${kid.full_name}`);
    }

    // ── 3. Approved weekly plan for the first child (so /schedule has items) ──
    const weekStart = isoMonday(now);
    await schedules.updateOne(
      { child_id: childIds[0], week_start: weekStart },
      {
        $set: {
          child_id: childIds[0],
          week_start: weekStart,
          approved_by_parent: true,
          items: [
            { day: 0, subject: "mathematics", topic_tag: "maths_number_fractions", topic_title: "Fractions", status: "planned", reason: "Test fixture." },
            { day: 1, subject: "english", topic_tag: "english_reading_inference", topic_title: "Inference", status: "planned", reason: "Test fixture." },
            { day: 2, subject: "science", topic_tag: "science_biology_cells", topic_title: "Cells", status: "planned", reason: "Test fixture." },
          ],
          generated_at: now,
        },
      },
      { upsert: true },
    );
    console.log(`✓ Approved weekly plan ready (week ${weekStart})`);

    // ── 4. Baseline evaluation for the first child (predicted grade) ──
    const existingEval = await evaluations.findOne({ child_id: childIds[0], mock_exam: { $ne: true } });
    if (!existingEval) {
      await evaluations.insertOne({
        child_id: childIds[0],
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

    // ── 5. ADMIN (role: admin) ──
    await parents.updateOne(
      { email: adminEmail },
      {
        $set: {
          email: adminEmail,
          password_hash: await bcrypt.hash(adminPassword, ROUNDS),
          role: "admin",
          is_smoke_account: true,
          email_verified: true,
          updated_at: now,
        },
        $setOnInsert: {
          full_name: "Scout Admin",
          subscription_tier: "diagnostic",
          billing_status: "trialing",
          token_version: 0,
          created_at: now,
        },
      },
      { upsert: true },
    );
    console.log(`✓ Admin ready: ${adminEmail} (role: admin)`);

    // ── 6. TUTOR (role: tutor) ──
    await parents.updateOne(
      { email: tutorEmail },
      {
        $set: {
          email: tutorEmail,
          password_hash: await bcrypt.hash(tutorPassword, ROUNDS),
          role: "tutor",
          is_smoke_account: true,
          email_verified: true,
          updated_at: now,
        },
        $setOnInsert: {
          full_name: "Scout Tutor",
          subscription_tier: "diagnostic",
          billing_status: "trialing",
          token_version: 0,
          created_at: now,
        },
      },
      { upsert: true },
    );
    console.log(`✓ Tutor ready: ${tutorEmail} (role: tutor)`);

    console.log("\n✅ Test accounts ready. Scout can sign in at /login with each.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("✗ seed-test-accounts failed:", err);
  process.exit(1);
});
