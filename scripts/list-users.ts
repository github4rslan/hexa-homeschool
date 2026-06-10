/**
 * Read-only: list parent accounts in the hexa DB.
 * Run: npx tsx scripts/list-users.ts
 */
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local */
  }
}

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || "hexa");
    const parents = await db
      .collection("parents")
      .find({}, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    console.log(`\nParents in "${db.databaseName}": ${parents.length}\n`);
    for (const p of parents) {
      console.log(
        [
          p.email,
          `verified=${p.email_verified ?? "(legacy/unset)"}`,
          `tier=${p.subscription_tier ?? "?"}`,
          `created=${p.created_at ? new Date(p.created_at).toISOString().slice(0, 16) : "?"}`,
        ].join("  |  "),
      );
    }

    const childCount = await db.collection("children").countDocuments();
    console.log(`\nChildren: ${childCount}\n`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
