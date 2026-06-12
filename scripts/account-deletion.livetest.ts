/**
 * LIVE verification of exportFamilyData + deleteFamilyData against a
 * throwaway family (master-quality-plan Phase 3 exception: deletion must be
 * tested against a self-created account before committing).
 *
 * Everything created here uses a unique throwaway email and the created ids
 * only — no other family's data can be touched. Run deliberately with:
 *   npx vitest run --config vitest.live.config.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";

// Load .env.local BEFORE importing lib/mongodb (it reads MONGODB_URI at module load).
for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { getCollection, Collections } = await import("@/lib/mongodb");
const { exportFamilyData, deleteFamilyData } = await import("@/lib/db/repo");

const STAMP = Date.now();
const EMAIL = `deletion-test-${STAMP}@example.invalid`;

describe("account deletion (live, throwaway family)", () => {
  let parentId = "";
  let childOid: ObjectId;

  it("creates a throwaway family with rows in every cascaded collection", async () => {
    const parents = await getCollection(Collections.parents);
    const now = new Date();
    const pRes = await parents.insertOne({
      email: EMAIL,
      full_name: "Deletion Test",
      password_hash: "x",
      email_verified: true,
      subscription_tier: "diagnostic",
      billing_status: "trialing",
      created_at: now,
      updated_at: now,
    });
    parentId = pRes.insertedId.toHexString();

    const children = await getCollection(Collections.children);
    const cRes = await children.insertOne({
      parent_id: pRes.insertedId,
      full_name: "Throwaway Child",
      date_of_birth: "2013-01-01",
      send_indicators: [],
      target_exam_window: null,
      created_at: now,
      updated_at: now,
    });
    childOid = cRes.insertedId;

    const seedRows: [string, Record<string, unknown>][] = [
      [Collections.evaluations, { child_id: childOid, subject: "mathematics", raw_score: 50, model_predicted_grade: "4", confidence_interval: 0.5, mock_exam: false, created_at: now }],
      [Collections.lessonLogs, { child_id: childOid, topic_tag: "t", status: "completed", timestamp_start: now, timestamp_end: now, count_attempts: 1, hints_counter: 0, mastery_score: 1, created_at: now }],
      [Collections.competence, { child_id: childOid, topic_tag: "t", state: "training", certified_at: null, updated_at: now }],
      [Collections.checkins, { child_id: childOid, mood: 3, difficulty_delta: 0, created_at: now }],
      [Collections.dossiers, { child_id: childOid, reporting_period: "test", secure_hash: "h", generated_at: now }],
      [Collections.schedules, { child_id: childOid, week_start: "2026-06-08", items: [], approved_by_parent: false, generated_at: now }],
      [Collections.escalations, { child_id: childOid, trigger: "test", severity: "low", matched_text: "test", status: "open", created_at: now }],
      [Collections.media, { owner_id: null, child_id: childOid, use_case: "child_work", folder: "f", public_id: `del-test-${STAMP}`, secure_url: "https://example.invalid", resource_type: "image", is_public: false, created_at: now }],
      [Collections.tutorBookings, { parent_id: pRes.insertedId, child_id: childOid, subject: null, note: "t", requested_slot: "t", status: "requested", created_at: now }],
    ];
    for (const [name, doc] of seedRows) {
      await (await getCollection(name)).insertOne(doc);
    }
    expect(parentId).toBeTruthy();
  });

  it("exports the family with secrets stripped", async () => {
    const data = (await exportFamilyData(parentId)) as Record<string, unknown> & {
      parent: Record<string, unknown>;
      children: unknown[];
    };
    expect(data).toBeTruthy();
    expect(data.children).toHaveLength(1);
    expect(data.parent.password_hash).toBeUndefined();
    expect(data.parent.email).toBe(EMAIL);
    expect((data[Collections.lessonLogs] as unknown[]).length).toBe(1);
    expect((data[Collections.escalations] as unknown[]).length).toBe(1);
  });

  it("deletes the entire family and leaves nothing behind", async () => {
    const deleted = await deleteFamilyData(parentId);
    expect(deleted).toBeTruthy();
    expect(deleted![Collections.parents]).toBe(1);
    expect(deleted![Collections.children]).toBe(1);
    expect(deleted![Collections.lessonLogs]).toBe(1);
    expect(deleted![Collections.escalations]).toBe(1);
    expect(deleted![Collections.tutorBookings]).toBe(1);

    // Independently verify nothing remains for these ids.
    const parents = await getCollection(Collections.parents);
    expect(await parents.countDocuments({ email: EMAIL })).toBe(0);
    for (const name of [
      Collections.evaluations,
      Collections.lessonLogs,
      Collections.competence,
      Collections.checkins,
      Collections.dossiers,
      Collections.schedules,
      Collections.escalations,
      Collections.media,
    ]) {
      const col = await getCollection(name);
      expect(await col.countDocuments({ child_id: childOid })).toBe(0);
    }
  });
});

afterAll(async () => {
  // Safety net: if an assertion failed midway, remove any leftovers.
  const parents = await getCollection(Collections.parents);
  const leftover = await parents.findOne({ email: EMAIL });
  if (leftover) {
    await deleteFamilyData(leftover._id.toHexString());
  }
});
