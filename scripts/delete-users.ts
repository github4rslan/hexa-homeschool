/**
 * One-off: delete specific parent accounts (and their children) by email.
 * Run: npx tsx scripts/delete-users.ts
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
    /* none */
  }
}

const EMAILS = [
  "a20364955@gmail.com",
  "infinione2@gmail.com",
  "aziz.work78@gmail.com",
  "azizahmedlondon@gmail.com",
];

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || "hexa");
    const parents = db.collection("parents");
    const children = db.collection("children");

    const docs = await parents
      .find({ email: { $in: EMAILS } })
      .project({ _id: 1, email: 1 })
      .toArray();

    console.log(`Found ${docs.length} matching accounts.`);
    for (const d of docs) {
      const kids = await children.deleteMany({ parent_id: d._id });
      await parents.deleteOne({ _id: d._id });
      console.log(`Deleted ${d.email}  (children removed: ${kids.deletedCount})`);
    }

    const remaining = await parents.countDocuments();
    console.log(`\nRemaining parents: ${remaining}`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
