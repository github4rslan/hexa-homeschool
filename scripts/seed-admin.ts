/**
 * Edway admin seed — create or promote a single staff (admin) account.
 *
 * Reuses the normal auth model: a parent document with `role: "admin"`. There is
 * NO separate admin auth system and NO hardcoded credential — the email and
 * password come from environment variables so nothing secret is ever committed
 * (this repo is public). After running, sign in at /login and you land on /admin.
 *
 * Idempotent: upserts by email. Re-running updates the password hash and
 * re-asserts the admin role; it never creates a duplicate. The plaintext
 * password is never printed or logged.
 *
 * Usage:
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-long-strong-password" npm run seed:admin
 * or put ADMIN_EMAIL / ADMIN_PASSWORD in .env.local, then: npm run seed:admin
 *
 * Reads MONGODB_URI / MONGODB_DB / ADMIN_EMAIL / ADMIN_PASSWORD from the
 * environment or .env.local (no dotenv dependency). Touches the LIVE db that
 * MONGODB_URI points at — run it deliberately.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// Matches src/lib/auth/password.ts (that module is `server-only`, so we can't
// import it into a plain script — keep this constant in sync with it).
const ROUNDS = 12;
// Admin holds cross-family + children's data, so require a stronger password
// than the 8-char parent minimum.
const MIN_PASSWORD = 12;

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
  const email = (process.env.ADMIN_EMAIL || fileEnv.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || fileEnv.ADMIN_PASSWORD || "";

  if (!uri) {
    console.error("✗ MONGODB_URI not found (env or .env.local). Aborting.");
    process.exit(1);
  }
  if (!email || !password) {
    console.error(
      "✗ ADMIN_EMAIL and ADMIN_PASSWORD are required (env or .env.local). Aborting.",
    );
    process.exit(1);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("✗ ADMIN_EMAIL is not a valid email address. Aborting.");
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD) {
    console.error(
      `✗ ADMIN_PASSWORD must be at least ${MIN_PASSWORD} characters. Aborting.`,
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, ROUNDS);
  const now = new Date();

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const parents = client.db(dbName).collection("parents");

    const result = await parents.updateOne(
      { email },
      {
        // Always (re)assert on an existing or new account.
        $set: {
          email,
          password_hash: passwordHash,
          role: "admin",
          email_verified: true,
        },
        // Only when creating the account for the first time — don't clobber a
        // real parent's profile/billing if this email already belongs to one.
        $setOnInsert: {
          full_name: "Admin",
          subscription_tier: "diagnostic",
          billing_status: "trialing",
          token_version: 0,
          created_at: now,
        },
      },
      { upsert: true },
    );

    const created = result.upsertedCount > 0;
    console.log(
      `✓ Admin account ${created ? "created" : "updated"}: ${email} (role: admin, email_verified: true)`,
    );
    console.log("  Sign in at /login with this email and the password you set.");
    if (!created) {
      console.log(
        "  Note: this email already existed — its password was reset and admin role granted.",
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("✗ seed-admin failed:", err);
  process.exit(1);
});
