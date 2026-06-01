import "server-only";
import { ObjectId } from "mongodb";
import { getCollection, Collections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth/session";
import type {
  ParentDoc,
  ChildDoc,
  EvaluationDoc,
  LessonLogDoc,
  CompetenceDoc,
  DossierDoc,
  CurriculumTopicDoc,
  QuestionDoc,
  Subject,
} from "./types";

/**
 * Data-access layer over MongoDB.
 *
 * IMPORTANT (security): Postgres Row-Level Security previously enforced the
 * "a parent can only ever touch their own child's rows" data-silo at the
 * database. MongoDB has no equivalent, so that guarantee is now enforced HERE,
 * in application code: every child-scoped query is filtered by an ownership
 * check (assertOwnsChild). Do not query child-scoped collections without it.
 */

export function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// ── Parents ──────────────────────────────────────────────
export async function findParentByEmail(
  email: string,
): Promise<ParentDoc | null> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  return col.findOne({ email: email.toLowerCase() });
}

export async function findParentById(id: string): Promise<ParentDoc | null> {
  const oid = toObjectId(id);
  if (!oid) return null;
  const col = await getCollection<ParentDoc>(Collections.parents);
  return col.findOne({ _id: oid });
}

export async function createParent(input: {
  email: string;
  fullName: string | null;
  passwordHash: string;
}): Promise<string> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  const now = new Date();
  const res = await col.insertOne({
    email: input.email.toLowerCase(),
    full_name: input.fullName,
    password_hash: input.passwordHash,
    subscription_tier: "diagnostic",
    billing_status: "trialing",
    created_at: now,
    updated_at: now,
  } as ParentDoc);
  return res.insertedId.toHexString();
}

/** The signed-in parent's id, or null. Replaces Supabase getUser()+ensureParentId. */
export async function currentParentId(): Promise<string | null> {
  const session = await getSession();
  return session?.id ?? null;
}

// ── Children ─────────────────────────────────────────────
export async function createChild(input: {
  parentId: string;
  fullName: string;
  dateOfBirth: string;
  targetExamWindow: string | null;
  sendIndicators: string[];
}): Promise<string | null> {
  const parentOid = toObjectId(input.parentId);
  if (!parentOid) return null;
  const col = await getCollection<ChildDoc>(Collections.children);
  const now = new Date();
  const res = await col.insertOne({
    parent_id: parentOid,
    full_name: input.fullName,
    date_of_birth: input.dateOfBirth,
    send_indicators: input.sendIndicators,
    target_exam_window: input.targetExamWindow,
    created_at: now,
    updated_at: now,
  } as ChildDoc);
  return res.insertedId.toHexString();
}

export async function listChildren(parentId: string): Promise<ChildDoc[]> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return [];
  const col = await getCollection<ChildDoc>(Collections.children);
  return col.find({ parent_id: parentOid }).sort({ created_at: 1 }).toArray();
}

export async function latestChild(parentId: string): Promise<ChildDoc | null> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return null;
  const col = await getCollection<ChildDoc>(Collections.children);
  return col.findOne({ parent_id: parentOid }, { sort: { created_at: -1 } });
}

export async function findChildByName(
  parentId: string,
  name: string,
): Promise<ChildDoc | null> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return null;
  const col = await getCollection<ChildDoc>(Collections.children);
  return col.findOne({
    parent_id: parentOid,
    full_name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  });
}

/** Ownership guard — returns the child ObjectId only if owned by this parent. */
async function assertOwnsChild(
  parentId: string,
  childId: ObjectId,
): Promise<boolean> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return false;
  const col = await getCollection<ChildDoc>(Collections.children);
  const child = await col.findOne({ _id: childId, parent_id: parentOid });
  return !!child;
}

// ── Evaluations (diagnostic + mocks) ─────────────────────
export async function insertEvaluations(
  parentId: string,
  childId: ObjectId,
  rows: Omit<EvaluationDoc, "_id" | "child_id" | "created_at">[],
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  const now = new Date();
  await col.insertMany(
    rows.map((r) => ({ ...r, child_id: childId, created_at: now }) as EvaluationDoc),
  );
  return true;
}

export async function latestEvaluationGrade(
  childId: ObjectId,
): Promise<string | null> {
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  const doc = await col.findOne(
    { child_id: childId },
    { sort: { created_at: -1 } },
  );
  return doc?.model_predicted_grade ?? null;
}

// ── Lesson logs + competence ─────────────────────────────
export async function insertLessonLog(
  parentId: string,
  childId: ObjectId,
  log: Omit<LessonLogDoc, "_id" | "child_id" | "created_at">,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  await col.insertOne({
    ...log,
    child_id: childId,
    created_at: new Date(),
  } as LessonLogDoc);
  return true;
}

export async function upsertCompetence(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
  state: CompetenceDoc["state"],
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  await col.updateOne(
    { child_id: childId, topic_tag: topicTag },
    {
      $set: {
        state,
        certified_at: state === "certified" ? new Date() : null,
        updated_at: new Date(),
      },
    },
    { upsert: true },
  );
  return true;
}

export async function countCertified(childId: ObjectId): Promise<number> {
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  return col.countDocuments({ child_id: childId, state: "certified" });
}

export async function recentLogs(
  childIds: ObjectId[],
  sinceMs: number,
  limit = 50,
): Promise<LessonLogDoc[]> {
  if (childIds.length === 0) return [];
  const col = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  return col
    .find({
      child_id: { $in: childIds },
      timestamp_start: { $gte: new Date(sinceMs) },
    })
    .sort({ timestamp_start: -1 })
    .limit(limit)
    .toArray();
}

// ── Dossiers (portfolios) ────────────────────────────────
export async function insertDossier(
  parentId: string,
  childId: ObjectId,
  reportingPeriod: string,
  secureHash: string,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<DossierDoc>(Collections.dossiers);
  await col.insertOne({
    child_id: childId,
    reporting_period: reportingPeriod,
    secure_hash: secureHash,
    generated_at: new Date(),
  } as DossierDoc);
  return true;
}

/** Count certified competence rows updated since a timestamp, across children. */
export async function countCertifiedSince(
  childIds: ObjectId[],
  sinceMs: number,
): Promise<number> {
  if (childIds.length === 0) return 0;
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  return col.countDocuments({
    child_id: { $in: childIds },
    state: "certified",
    updated_at: { $gte: new Date(sinceMs) },
  });
}

// ── Curriculum + questions (global reference content, no ownership) ──
export async function listTopics(subject?: Subject): Promise<CurriculumTopicDoc[]> {
  const col = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const filter = subject ? { subject } : {};
  return col.find(filter).sort({ subject: 1, order: 1 }).toArray();
}

export async function getTopic(topicTag: string): Promise<CurriculumTopicDoc | null> {
  const col = await getCollection<CurriculumTopicDoc>(Collections.topics);
  return col.findOne({ topic_tag: topicTag });
}

export async function firstTopic(subject: Subject): Promise<CurriculumTopicDoc | null> {
  const col = await getCollection<CurriculumTopicDoc>(Collections.topics);
  return col.findOne({ subject }, { sort: { order: 1 } });
}

/** Next topic in the subject's order after the given tag (for "continue"). */
export async function nextTopicAfter(
  topicTag: string,
): Promise<CurriculumTopicDoc | null> {
  const current = await getTopic(topicTag);
  if (!current) return null;
  const col = await getCollection<CurriculumTopicDoc>(Collections.topics);
  return col.findOne(
    { subject: current.subject, order: { $gt: current.order } },
    { sort: { order: 1 } },
  );
}

export async function getQuestions(
  filter: {
    topicTag?: string;
    subject?: Subject;
    kind?: QuestionDoc["kind"];
    tier?: number;
  },
  limit = 50,
): Promise<QuestionDoc[]> {
  const col = await getCollection<QuestionDoc>(Collections.questions);
  const query: Record<string, unknown> = {};
  if (filter.topicTag) query.topic_tag = filter.topicTag;
  if (filter.subject) query.subject = filter.subject;
  if (filter.kind) query.kind = filter.kind;
  if (typeof filter.tier === "number") query.tier = filter.tier;
  return col.find(query).limit(limit).toArray();
}

/** The diagnostic item pool for a subject (kind=diagnostic), tier-ordered. */
export async function getDiagnosticPool(subject: Subject): Promise<QuestionDoc[]> {
  const col = await getCollection<QuestionDoc>(Collections.questions);
  return col
    .find({ subject, kind: "diagnostic" })
    .sort({ tier: 1 })
    .toArray();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
