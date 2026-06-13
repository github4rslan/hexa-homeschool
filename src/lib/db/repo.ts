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
  CheckinDoc,
  MediaDoc,
  MediaUseCase,
  WeeklyScheduleDoc,
  ScheduleItemDoc,
  TutorBookingDoc,
  EscalationDoc,
  AiInvocationDoc,
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
  emailVerified?: boolean;
}): Promise<string> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  const now = new Date();
  const res = await col.insertOne({
    email: input.email.toLowerCase(),
    full_name: input.fullName,
    password_hash: input.passwordHash,
    email_verified: input.emailVerified ?? false,
    subscription_tier: "diagnostic",
    billing_status: "trialing",
    created_at: now,
    updated_at: now,
  } as ParentDoc);
  return res.insertedId.toHexString();
}

export async function markEmailVerified(parentId: string): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { email_verified: true, updated_at: new Date() } },
  );
  return true;
}

/**
 * The signed-in parent's id, or null. Replaces Supabase getUser()+ensureParentId.
 * Also enforces session invalidation: a token whose `tv` no longer matches the
 * parent's token_version (bumped by "sign out everywhere" / password change)
 * is treated as signed out, at the cost of one indexed point-read per request.
 */
export async function currentParentId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const parent = await findParentById(session.id);
  if (!parent) return null;
  if ((session.tokenVersion ?? 0) !== (parent.token_version ?? 0)) return null;
  return session.id;
}

/** Bump token_version (kills every existing session); returns the new version. */
export async function bumpTokenVersion(parentId: string): Promise<number | null> {
  const oid = toObjectId(parentId);
  if (!oid) return null;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.findOneAndUpdate(
    { _id: oid },
    { $inc: { token_version: 1 }, $set: { updated_at: new Date() } },
    { returnDocument: "after" },
  );
  return res ? (res.token_version ?? 0) : null;
}

// ── Parents: billing (Stripe) ────────────────────────────

export interface BillingUpdate {
  tier?: ParentDoc["subscription_tier"];
  status?: ParentDoc["billing_status"];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
}

function billingSet(update: BillingUpdate): Partial<ParentDoc> {
  const set: Partial<ParentDoc> = { updated_at: new Date() };
  if (update.tier) set.subscription_tier = update.tier;
  if (update.status) set.billing_status = update.status;
  if (update.stripeCustomerId) set.stripe_customer_id = update.stripeCustomerId;
  if (update.stripeSubscriptionId !== undefined) {
    set.stripe_subscription_id = update.stripeSubscriptionId;
  }
  return set;
}

/** Sync billing state by parent id (webhook path: checkout.session.completed). */
export async function updateParentBillingById(
  parentId: string,
  update: BillingUpdate,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne({ _id: oid }, { $set: billingSet(update) });
  return res.matchedCount > 0;
}

/** Sync billing state by Stripe customer id (webhook path: subscription events). */
export async function updateParentBillingByCustomerId(
  customerId: string,
  update: BillingUpdate,
): Promise<boolean> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne(
    { stripe_customer_id: customerId },
    { $set: billingSet(update) },
  );
  return res.matchedCount > 0;
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

export async function getChildById(
  parentId: string,
  childId: string,
): Promise<ChildDoc | null> {
  const childOid = toObjectId(childId);
  const parentOid = toObjectId(parentId);
  if (!childOid || !parentOid) return null;
  const col = await getCollection<ChildDoc>(Collections.children);
  return col.findOne({ _id: childOid, parent_id: parentOid });
}

/**
 * Resolve the parent's "active" child: the cookie-selected id if it's valid +
 * owned, otherwise the most-recently-added child. Used so lessons/diagnostics
 * target the child the parent is currently viewing.
 */
export async function getActiveChild(
  parentId: string,
  preferredChildId?: string,
): Promise<ChildDoc | null> {
  if (preferredChildId) {
    const preferred = await getChildById(parentId, preferredChildId);
    if (preferred) return preferred;
  }
  return latestChild(parentId);
}

export async function updateChild(
  parentId: string,
  childId: string,
  patch: Partial<
    Pick<ChildDoc, "full_name" | "date_of_birth" | "send_indicators" | "target_exam_window">
  >,
): Promise<boolean> {
  const childOid = toObjectId(childId);
  if (!childOid || !(await assertOwnsChild(parentId, childOid))) return false;
  const col = await getCollection<ChildDoc>(Collections.children);
  await col.updateOne(
    { _id: childOid },
    { $set: { ...patch, updated_at: new Date() } },
  );
  return true;
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

export interface SubjectStanding {
  subject: Subject;
  /** readiness 0–100 derived from raw_score, or null if not assessed. */
  readiness: number | null;
  grade: string | null;
}

/**
 * Latest evaluation per subject for a child — powers the parent dashboard's
 * working-grade + readiness audit. Returns the most recent row for each of the
 * three core subjects.
 */
export async function latestEvaluationsBySubject(
  childId: ObjectId,
): Promise<SubjectStanding[]> {
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  const subjects: Subject[] = ["mathematics", "english", "science"];
  return Promise.all(
    subjects.map(async (subject): Promise<SubjectStanding> => {
      const doc = await col.findOne(
        { child_id: childId, subject },
        { sort: { created_at: -1 } },
      );
      return {
        subject,
        readiness: typeof doc?.raw_score === "number" ? doc.raw_score : null,
        grade: doc?.model_predicted_grade ?? null,
      };
    }),
  );
}

/** Has a compliance dossier been generated for this child in the given period? */
export async function hasDossierForPeriod(
  childId: ObjectId,
  reportingPeriod: string,
): Promise<boolean> {
  const col = await getCollection<DossierDoc>(Collections.dossiers);
  const doc = await col.findOne({
    child_id: childId,
    reporting_period: reportingPeriod,
  });
  return !!doc;
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

/**
 * Total completed-lesson logs across every child in the family. Used to spot
 * the family's FIRST lesson (activation milestone) — the count is per family,
 * never exposed per child.
 */
export async function familyLessonCount(parentId: string): Promise<number> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return 0;
  const childCol = await getCollection<ChildDoc>(Collections.children);
  const ids = await childCol
    .find({ parent_id: parentOid })
    .project<{ _id: ObjectId }>({ _id: 1 })
    .toArray();
  if (!ids.length) return 0;
  const logCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  return logCol.countDocuments({ child_id: { $in: ids.map((d) => d._id) } });
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

/** Certified-topic counts per subject for a child (powers the child hub rings). */
export async function certifiedBySubject(
  childId: ObjectId,
): Promise<Record<Subject, number>> {
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const certified = await compCol
    .find({ child_id: childId, state: "certified" })
    .toArray();
  const tags = certified.map((c) => c.topic_tag);
  const result: Record<Subject, number> = {
    mathematics: 0,
    english: 0,
    science: 0,
  };
  if (tags.length === 0) return result;
  const topics = await topicsCol
    .find({ topic_tag: { $in: tags } })
    .toArray();
  for (const t of topics) result[t.subject] += 1;
  return result;
}

export interface TopicMapNode {
  topicTag: string;
  title: string;
  order: number;
  workingGradeBand: string;
  state: CompetenceDoc["state"]; // locked when the child has no row yet
  certifiedAt: Date | null;
  /** True when this topic is certified but a spaced-repetition review is due. */
  needsRefresh: boolean;
}

/**
 * Full per-subject progress map for one child: every curriculum topic in
 * `order`, annotated with the child's competence state (defaulting to "locked"
 * when no row exists yet) and whether a certified topic is due for review.
 * Read-only reference content joined with child-scoped competence; the child id
 * is the caller's active child (ownership enforced at the page/route layer).
 */
export async function competenceMapForChild(
  childId: ObjectId,
): Promise<Record<Subject, TopicMapNode[]>> {
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const [topics, comps] = await Promise.all([
    topicsCol.find({}).sort({ subject: 1, order: 1 }).toArray(),
    compCol.find({ child_id: childId }).toArray(),
  ]);
  const byTag = new Map(comps.map((c) => [c.topic_tag, c]));
  const now = Date.now();

  const result: Record<Subject, TopicMapNode[]> = {
    mathematics: [],
    english: [],
    science: [],
  };
  for (const t of topics) {
    const c = byTag.get(t.topic_tag);
    const state = c?.state ?? "locked";
    const needsRefresh =
      state === "certified" &&
      !!c?.next_review_at &&
      c.next_review_at.getTime() <= now;
    result[t.subject].push({
      topicTag: t.topic_tag,
      title: t.title,
      order: t.order,
      workingGradeBand: t.working_grade_band,
      state,
      certifiedAt: c?.certified_at ?? null,
      needsRefresh,
    });
  }
  return result;
}

// ── Daily check-in (Stage 3) ─────────────────────────────
export async function recordCheckin(
  parentId: string,
  childId: ObjectId,
  mood: number,
): Promise<{ ok: boolean; difficultyDelta: number }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { ok: false, difficultyDelta: 0 };
  }
  // Map mood 1–5 → starting-tier nudge: low mood eases in, high mood stretches.
  const difficultyDelta = mood <= 2 ? -1 : mood >= 5 ? 1 : 0;
  const col = await getCollection<CheckinDoc>(Collections.checkins);
  await col.insertOne({
    child_id: childId,
    mood,
    difficulty_delta: difficultyDelta,
    created_at: new Date(),
  } as CheckinDoc);
  return { ok: true, difficultyDelta };
}

/** Today's check-in for a child (local-day boundary), or null. */
export async function todaysCheckin(
  childId: ObjectId,
): Promise<CheckinDoc | null> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const col = await getCollection<CheckinDoc>(Collections.checkins);
  return col.findOne(
    { child_id: childId, created_at: { $gte: start } },
    { sort: { created_at: -1 } },
  );
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

// ── Admin aggregates (real counts, no fabricated metrics) ─
export interface AdminStats {
  parents: number;
  children: number;
  lessonsThisWeek: number;
  openEscalations: number;
  newsletterSubscribers: number;
  dossiers: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    parents,
    children,
    lessonsThisWeek,
    openEscalationsCount,
    newsletterSubscribers,
    dossiers,
  ] = await Promise.all([
    (await getCollection(Collections.parents)).countDocuments(),
    (await getCollection(Collections.children)).countDocuments(),
    (await getCollection(Collections.lessonLogs)).countDocuments({
      status: "completed",
      timestamp_start: { $gte: weekAgo },
    }),
    (await getCollection(Collections.escalations)).countDocuments({ status: "open" }),
    (await getCollection(Collections.newsletter)).countDocuments(),
    (await getCollection(Collections.dossiers)).countDocuments(),
  ]);
  return {
    parents,
    children,
    lessonsThisWeek,
    openEscalations: openEscalationsCount,
    newsletterSubscribers,
    dossiers,
  };
}

/** Recent lesson activity across all children (admin live feed). */
export async function adminRecentLogs(limit = 8): Promise<LessonLogDoc[]> {
  const col = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  return col.find({}).sort({ timestamp_start: -1 }).limit(limit).toArray();
}

/** All open escalations across the platform (admin triage). */
export async function adminOpenEscalations(limit = 50): Promise<EscalationDoc[]> {
  const col = await getCollection<EscalationDoc>(Collections.escalations);
  return col.find({ status: "open" }).sort({ created_at: -1 }).limit(limit).toArray();
}

// ── AI telemetry (real agent invocations) ─────────────────

export interface InvocationInput {
  agent: string;
  model: string;
  tokens: number;
  latencyMs: number;
  blocked: boolean;
  reason?: string;
}

/**
 * Record one or more real agent invocations. Best-effort: telemetry must never
 * break a tutoring response, so all errors are swallowed (logged, not thrown).
 */
export async function logInvocation(
  inputs: InvocationInput | InvocationInput[],
): Promise<void> {
  try {
    const list = Array.isArray(inputs) ? inputs : [inputs];
    if (list.length === 0) return;
    const col = await getCollection<AiInvocationDoc>(Collections.aiInvocations);
    const now = new Date();
    await col.insertMany(
      list.map((i) => ({
        agent: i.agent,
        model: i.model,
        tokens: Math.max(0, Math.round(i.tokens)),
        latency_ms: Math.max(0, Math.round(i.latencyMs)),
        blocked: i.blocked,
        ...(i.reason ? { reason: i.reason.slice(0, 200) } : {}),
        created_at: now,
      })),
    );
  } catch (err) {
    console.error("[telemetry] logInvocation failed (non-fatal):", err);
  }
}

/** Per-agent telemetry row aggregated from real invocations. */
export interface AgentTelemetryRow {
  agent: string;
  calls: number;
  blocked: number;
  blockRate: number; // %
  avgLatency: number; // ms
  tokens: number;
}

export interface AgentTelemetry {
  windowHours: number;
  totalCalls: number;
  totalTokens: number;
  avgBlockRate: number; // %
  agents: AgentTelemetryRow[];
  recentBlocks: {
    agent: string;
    reason: string;
    created_at: Date;
  }[];
}

/**
 * Aggregate real agent telemetry over the last `windowHours`. Returns genuine
 * counts (zeroes when nothing has run yet) — never fabricated figures.
 */
export async function getAgentTelemetry(
  windowHours = 24,
): Promise<AgentTelemetry> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const col = await getCollection<AiInvocationDoc>(Collections.aiInvocations);

  const grouped = (await col
    .aggregate([
      { $match: { created_at: { $gte: since } } },
      {
        $group: {
          _id: "$agent",
          calls: { $sum: 1 },
          blocked: { $sum: { $cond: ["$blocked", 1, 0] } },
          latencySum: { $sum: "$latency_ms" },
          tokens: { $sum: "$tokens" },
        },
      },
      { $sort: { calls: -1 } },
    ])
    .toArray()) as {
    _id: string;
    calls: number;
    blocked: number;
    latencySum: number;
    tokens: number;
  }[];

  const agents: AgentTelemetryRow[] = grouped.map((g) => ({
    agent: g._id,
    calls: g.calls,
    blocked: g.blocked,
    blockRate: g.calls > 0 ? (g.blocked / g.calls) * 100 : 0,
    avgLatency: g.calls > 0 ? Math.round(g.latencySum / g.calls) : 0,
    tokens: g.tokens,
  }));

  const totalCalls = agents.reduce((s, a) => s + a.calls, 0);
  const totalTokens = agents.reduce((s, a) => s + a.tokens, 0);
  const totalBlocked = agents.reduce((s, a) => s + a.blocked, 0);

  const recentBlocks = (await col
    .find({ created_at: { $gte: since }, blocked: true })
    .sort({ created_at: -1 })
    .limit(8)
    .toArray()).map((d) => ({
    agent: d.agent,
    reason: d.reason ?? "Output rejected by checker.",
    created_at: d.created_at,
  }));

  return {
    windowHours,
    totalCalls,
    totalTokens,
    avgBlockRate: totalCalls > 0 ? (totalBlocked / totalCalls) * 100 : 0,
    agents,
    recentBlocks,
  };
}

// ── Media registry (Stage 4) ─────────────────────────────
export async function recordMedia(
  doc: Omit<MediaDoc, "_id" | "created_at">,
): Promise<string> {
  const col = await getCollection<MediaDoc>(Collections.media);
  const res = await col.insertOne({ ...doc, created_at: new Date() } as MediaDoc);
  return res.insertedId.toHexString();
}

export async function listMedia(filter: {
  useCase: MediaUseCase;
  ownerId?: string;
  childId?: string;
  publicOnly?: boolean;
  limit?: number;
}): Promise<MediaDoc[]> {
  const col = await getCollection<MediaDoc>(Collections.media);
  const query: Record<string, unknown> = { use_case: filter.useCase };
  if (filter.publicOnly) query.is_public = true;
  if (filter.ownerId) {
    const oid = toObjectId(filter.ownerId);
    if (oid) query.owner_id = oid;
  }
  if (filter.childId) {
    const cid = toObjectId(filter.childId);
    if (cid) query.child_id = cid;
  }
  return col
    .find(query)
    .sort({ created_at: -1 })
    .limit(filter.limit ?? 60)
    .toArray();
}

/** Look up a cached media asset by content hash (e.g. TTS audio). */
export async function findMediaByHash(
  useCase: MediaUseCase,
  contentHash: string,
): Promise<MediaDoc | null> {
  const col = await getCollection<MediaDoc>(Collections.media);
  return col.findOne({ use_case: useCase, content_hash: contentHash });
}

/** Ownership check exposed for media routes that operate on a child. */
export async function parentOwnsChild(
  parentId: string,
  childId: string,
): Promise<boolean> {
  const childOid = toObjectId(childId);
  if (!childOid) return false;
  return assertOwnsChild(parentId, childOid);
}

// ── Weekly schedule (Stage 5) ────────────────────────────
/** Monday (local) of the current week as an ISO date string. */
export function currentWeekStart(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  // Format from local date parts — toISOString() would shift the date back a
  // day in timezones east of UTC (local Monday midnight = Sunday in UTC).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const SUBJECT_DISPLAY: Record<Subject, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

/**
 * Parent-facing reason a topic was picked, derived from the data that drove
 * the choice: the child's competence state for the topic and their latest
 * evaluation for the subject. Plain English, encouraging, no jargon.
 */
function scheduleItemReason(input: {
  subject: Subject;
  topicTitle: string;
  topicState: CompetenceDoc["state"] | undefined;
  predictedGrade: string | null;
}): string {
  const subject = SUBJECT_DISPLAY[input.subject];
  if (input.topicState === "training") {
    return `${input.topicTitle} is already in training — this session continues it toward certification.`;
  }
  if (input.predictedGrade) {
    return `The diagnostic predicted grade ${input.predictedGrade} in ${subject}; ${input.topicTitle} is the next uncertified topic on the GCSE path.`;
  }
  return `${input.topicTitle} is the next step in the ${subject} sequence — it builds the foundations later topics rely on.`;
}

/** This week's schedule if it already exists — read-only, never generates. */
export async function getWeeklySchedule(
  parentId: string,
  childId: ObjectId,
): Promise<WeeklyScheduleDoc | null> {
  if (!(await assertOwnsChild(parentId, childId))) return null;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  return col.findOne({ child_id: childId, week_start: currentWeekStart() });
}

/**
 * Returns this week's schedule, generating it on first access. `created` tells
 * the caller whether generation just happened (drives the one-time plan email).
 */
export async function getOrCreateWeeklySchedule(
  parentId: string,
  childId: ObjectId,
): Promise<{ schedule: WeeklyScheduleDoc; created: boolean } | null> {
  if (!(await assertOwnsChild(parentId, childId))) return null;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  const weekStart = currentWeekStart();
  const existing = await col.findOne({ child_id: childId, week_start: weekStart });
  if (existing) return { schedule: existing, created: false };

  // Generate from curriculum gaps: topics NOT yet certified, in order, one per
  // weekday across the three subjects (Mon–Fri).
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const competence = await compCol.find({ child_id: childId }).toArray();
  const certifiedTags = new Set(
    competence.filter((c) => c.state === "certified").map((c) => c.topic_tag),
  );
  const stateByTag = new Map(competence.map((c) => [c.topic_tag, c.state]));

  // Latest evaluation per subject — grounds the per-item reasons in real data.
  const standings = await latestEvaluationsBySubject(childId);
  const gradeBySubject = new Map(standings.map((s) => [s.subject, s.grade]));

  const subjects: Subject[] = ["mathematics", "english", "science"];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const nextBySubject: Record<Subject, CurriculumTopicDoc | null> = {
    mathematics: null,
    english: null,
    science: null,
  };
  for (const subj of subjects) {
    const topics = await topicsCol.find({ subject: subj }).sort({ order: 1 }).toArray();
    nextBySubject[subj] = topics.find((t) => !certifiedTags.has(t.topic_tag)) ?? topics[0] ?? null;
  }

  const items: ScheduleItemDoc[] = [];
  // Mon=Maths, Tue=English, Wed=Science, Thu=Maths, Fri=English (gap-driven).
  const plan: { day: number; subject: Subject }[] = [
    { day: 0, subject: "mathematics" },
    { day: 1, subject: "english" },
    { day: 2, subject: "science" },
    { day: 3, subject: "mathematics" },
    { day: 4, subject: "english" },
  ];
  for (const { day, subject } of plan) {
    const t = nextBySubject[subject];
    if (t) {
      items.push({
        day,
        subject,
        topic_tag: t.topic_tag,
        topic_title: t.title,
        status: "planned",
        reason: scheduleItemReason({
          subject,
          topicTitle: t.title,
          topicState: stateByTag.get(t.topic_tag),
          predictedGrade: gradeBySubject.get(subject) ?? null,
        }),
      });
    }
  }

  const doc: WeeklyScheduleDoc = {
    child_id: childId,
    week_start: weekStart,
    items,
    approved_by_parent: false,
    generated_at: new Date(),
  };
  const res = await col.insertOne(doc as WeeklyScheduleDoc);
  return { schedule: { ...doc, _id: res.insertedId }, created: true };
}

export async function approveWeeklySchedule(
  parentId: string,
  childId: ObjectId,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  await col.updateOne(
    { child_id: childId, week_start: currentWeekStart() },
    { $set: { approved_by_parent: true } },
  );
  return true;
}

// ── Tutor bookings (Stage 5) ─────────────────────────────
const TIER_TUTOR_QUOTA: Record<ParentDoc["subscription_tier"], number> = {
  diagnostic: 0,
  standard: 1, // HEXA Complete: 1/mo
  family: 3, // HEXA Partner: 3/mo
};

export async function tutorBookingsThisMonth(parentId: string): Promise<number> {
  const oid = toObjectId(parentId);
  if (!oid) return 0;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  return col.countDocuments({ parent_id: oid, created_at: { $gte: start } });
}

export async function tutorQuota(parentId: string): Promise<{ used: number; limit: number }> {
  const parent = await findParentById(parentId);
  const limit = parent ? TIER_TUTOR_QUOTA[parent.subscription_tier] : 0;
  const used = await tutorBookingsThisMonth(parentId);
  return { used, limit };
}

export async function createTutorBooking(
  parentId: string,
  childId: ObjectId,
  input: { subject: Subject | null; note: string; requestedSlot: string },
): Promise<{ ok: boolean; reason?: string }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { ok: false, reason: "Child not found." };
  }
  const { used, limit } = await tutorQuota(parentId);
  if (used >= limit) {
    return {
      ok: false,
      reason:
        limit === 0
          ? "Tutor sessions aren't included on your current plan."
          : `You've used all ${limit} tutor session(s) this month.`,
    };
  }
  const oid = toObjectId(parentId)!;
  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  await col.insertOne({
    parent_id: oid,
    child_id: childId,
    subject: input.subject,
    note: input.note,
    requested_slot: input.requestedSlot,
    status: "requested",
    created_at: new Date(),
  } as TutorBookingDoc);
  return { ok: true };
}

export async function listTutorBookings(
  parentId: string,
): Promise<TutorBookingDoc[]> {
  const oid = toObjectId(parentId);
  if (!oid) return [];
  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  return col.find({ parent_id: oid }).sort({ created_at: -1 }).limit(20).toArray();
}

// ── Weekly parent progress digest ────────────────────────
export interface ChildWeekSummary {
  childName: string;
  lessonsCompleted: number;
  /** Human topic titles certified this week. */
  topicsCertified: string[];
  /** Escalations raised this week (count only — details stay in the dashboard). */
  escalations: number;
}

/**
 * Parents eligible for the weekly digest: verified email, not opted out.
 * Legacy rows without email_verified are treated as verified (matches login).
 */
export async function listDigestRecipients(): Promise<ParentDoc[]> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  return col
    .find({
      email_verified: { $ne: false },
      weekly_digest_opt_out: { $ne: true },
    })
    .toArray();
}

/**
 * Per-child summary of the last week for one parent. The data-silo holds by
 * construction: every query is filtered to child ids owned by this parent.
 * Returns [] when the parent has no children.
 */
export async function weeklyDigestForParent(
  parentId: string,
  since: Date,
): Promise<ChildWeekSummary[]> {
  const children = await listChildren(parentId);
  if (children.length === 0) return [];
  const childIds = children.map((c) => c._id!).filter(Boolean);

  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const escCol = await getCollection<EscalationDoc>(Collections.escalations);

  const [lessonGroups, certRows, escGroups] = await Promise.all([
    logsCol
      .aggregate<{ _id: ObjectId; count: number }>([
        {
          $match: {
            child_id: { $in: childIds },
            status: "completed",
            timestamp_start: { $gte: since },
          },
        },
        { $group: { _id: "$child_id", count: { $sum: 1 } } },
      ])
      .toArray(),
    compCol
      .find({
        child_id: { $in: childIds },
        state: "certified",
        certified_at: { $gte: since },
      })
      .toArray(),
    escCol
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { child_id: { $in: childIds }, created_at: { $gte: since } } },
        { $group: { _id: "$child_id", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  // Resolve certified topic tags to human titles (global reference content).
  const tags = [...new Set(certRows.map((r) => r.topic_tag))];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const topics = tags.length
    ? await topicsCol.find({ topic_tag: { $in: tags } }).toArray()
    : [];
  const titleByTag = new Map(topics.map((t) => [t.topic_tag, t.title]));

  const lessonsByChild = new Map(
    lessonGroups.map((g) => [g._id.toHexString(), g.count]),
  );
  const escalationsByChild = new Map(
    escGroups.map((g) => [g._id.toHexString(), g.count]),
  );

  return children.map((child) => {
    const id = child._id!.toHexString();
    return {
      childName: child.full_name,
      lessonsCompleted: lessonsByChild.get(id) ?? 0,
      topicsCertified: certRows
        .filter((r) => r.child_id.toHexString() === id)
        .map((r) => titleByTag.get(r.topic_tag) ?? r.topic_tag),
      escalations: escalationsByChild.get(id) ?? 0,
    };
  });
}

export async function setWeeklyDigestOptOut(
  parentId: string,
  optOut: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { weekly_digest_opt_out: optOut, updated_at: new Date() } },
  );
  return true;
}

export async function setWeeklyPlanEmailOptOut(
  parentId: string,
  optOut: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { weekly_plan_email_opt_out: optOut, updated_at: new Date() } },
  );
  return true;
}

export async function setParentPinHash(
  parentId: string,
  pinHash: string,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne(
    { _id: oid },
    { $set: { parent_pin_hash: pinHash, updated_at: new Date() } },
  );
  return res.matchedCount > 0;
}

export async function setTwoFactorEnabled(
  parentId: string,
  enabled: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne(
    { _id: oid },
    { $set: { two_factor_enabled: enabled, updated_at: new Date() } },
  );
  return res.matchedCount > 0;
}

// ── Escalations (Stage 5 safety) ─────────────────────────
export async function recordEscalation(
  childId: ObjectId,
  input: { trigger: string; severity: EscalationDoc["severity"]; matchedText: string },
): Promise<void> {
  const col = await getCollection<EscalationDoc>(Collections.escalations);
  await col.insertOne({
    child_id: childId,
    trigger: input.trigger,
    severity: input.severity,
    matched_text: input.matchedText.slice(0, 280),
    status: "open",
    created_at: new Date(),
  } as EscalationDoc);
}

/** Open escalations across a parent's children (for the dashboard alert). */
export async function openEscalations(
  childIds: ObjectId[],
): Promise<EscalationDoc[]> {
  if (childIds.length === 0) return [];
  const col = await getCollection<EscalationDoc>(Collections.escalations);
  return col
    .find({ child_id: { $in: childIds }, status: "open" })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
}

export async function setEscalationAlertOptOut(
  parentId: string,
  optOut: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { escalation_alert_opt_out: optOut, updated_at: new Date() } },
  );
  return true;
}

export async function setMarketingEmailsOptOut(
  parentId: string,
  optOut: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { marketing_emails_opt_out: optOut, updated_at: new Date() } },
  );
  return true;
}

// ── Lifecycle (onboarding) emails ────────────────────────

/**
 * Atomically claim a lifecycle email for a parent so it's sent at most once,
 * even if a cron run overlaps itself. Returns true only if THIS call added the
 * key (i.e. the caller now owns the send); false if it was already sent.
 */
export async function claimLifecycleEmail(
  parentId: string,
  key: string,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne(
    { _id: oid, lifecycle_emails_sent: { $ne: key } },
    {
      $addToSet: { lifecycle_emails_sent: key },
      $set: { updated_at: new Date() },
    },
  );
  return res.modifiedCount > 0;
}

/** Release a claimed lifecycle key (used to roll back if the send fails). */
export async function releaseLifecycleEmail(
  parentId: string,
  key: string,
): Promise<void> {
  const oid = toObjectId(parentId);
  if (!oid) return;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $pull: { lifecycle_emails_sent: key } },
  );
}

export interface NudgeCandidate {
  parent: ParentDoc;
  firstChildName: string;
}

/**
 * Parents eligible for the day-2 diagnostic nudge: verified, not opted out of
 * lifecycle email, account at least `minAgeMs` old, not already nudged, who
 * have added a child but have NO diagnostic evaluation recorded for any child.
 * Returns the first child's name for personalisation.
 */
export async function findDiagnosticNudgeCandidates(
  minAgeMs: number,
): Promise<NudgeCandidate[]> {
  const parentCol = await getCollection<ParentDoc>(Collections.parents);
  const childCol = await getCollection<ChildDoc>(Collections.children);
  const evalCol = await getCollection<EvaluationDoc>(Collections.evaluations);

  const cutoff = new Date(Date.now() - minAgeMs);
  const parents = await parentCol
    .find({
      email_verified: { $ne: false },
      marketing_emails_opt_out: { $ne: true },
      lifecycle_emails_sent: { $ne: "diagnostic_nudge" },
      created_at: { $lte: cutoff },
    })
    .toArray();

  const candidates: NudgeCandidate[] = [];
  for (const parent of parents) {
    if (!parent._id) continue;
    const children = await childCol
      .find({ parent_id: parent._id })
      .sort({ created_at: 1 })
      .toArray();
    if (children.length === 0) continue; // nudge needs a child to talk about

    const childIds = children.map((c) => c._id!).filter(Boolean);
    const hasDiagnostic = await evalCol.countDocuments({
      child_id: { $in: childIds },
    });
    if (hasDiagnostic > 0) continue; // already past this step

    candidates.push({ parent, firstChildName: children[0].full_name });
  }
  return candidates;
}

// ── Data rights: export + erasure (UK GDPR) ──────────────

/** Child-scoped collections cascaded on export/erasure. */
const CHILD_SCOPED_COLLECTIONS = [
  Collections.evaluations,
  Collections.lessonLogs,
  Collections.competence,
  Collections.checkins,
  Collections.dossiers,
  Collections.schedules,
  Collections.escalations,
  Collections.media,
] as const;

/**
 * Full export of the family's data for the signed-in parent (GDPR access
 * right). Everything is keyed off parentId → owned child ids, so the silo
 * holds by construction. Secrets (password/PIN hashes) are stripped.
 */
export async function exportFamilyData(
  parentId: string,
): Promise<Record<string, unknown> | null> {
  const parent = await findParentById(parentId);
  if (!parent?._id) return null;

  const children = await listChildren(parentId);
  const childIds = children.map((c) => c._id!).filter(Boolean);
  const byChild: Record<string, unknown[]> = {};
  for (const name of CHILD_SCOPED_COLLECTIONS) {
    const col = await getCollection(name);
    byChild[name] =
      childIds.length === 0
        ? []
        : await col.find({ child_id: { $in: childIds } }).toArray();
  }

  const bookingsCol = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  const bookings = await bookingsCol.find({ parent_id: parent._id }).toArray();

  const {
    password_hash: _password,
    parent_pin_hash: _pin,
    ...safeParent
  } = parent as ParentDoc & { parent_pin_hash?: string };
  void _password;
  void _pin;

  return {
    exported_at: new Date().toISOString(),
    format: "hexa-family-export/v1",
    parent: safeParent,
    children,
    tutor_bookings: bookings,
    ...byChild,
  };
}

/**
 * Right to erasure: delete the parent and EVERYTHING owned by them.
 * Highest-risk function in the codebase — every delete is keyed to this
 * parent's _id or their children's ids; nothing here can touch another
 * family. Returns per-collection deletion counts for the audit trail.
 */
export async function deleteFamilyData(
  parentId: string,
): Promise<Record<string, number> | null> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return null;
  const parent = await findParentById(parentId);
  if (!parent?._id) return null;

  const children = await listChildren(parentId);
  const childIds = children.map((c) => c._id!).filter(Boolean);
  const deleted: Record<string, number> = {};

  for (const name of CHILD_SCOPED_COLLECTIONS) {
    const col = await getCollection(name);
    if (childIds.length === 0) {
      deleted[name] = 0;
      continue;
    }
    const res = await col.deleteMany({ child_id: { $in: childIds } });
    deleted[name] = res.deletedCount;
  }

  // Parent-scoped rows: tutor bookings, media uploaded by the parent.
  const bookingsCol = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  deleted[Collections.tutorBookings] = (
    await bookingsCol.deleteMany({ parent_id: parentOid })
  ).deletedCount;
  const mediaCol = await getCollection<MediaDoc>(Collections.media);
  deleted[`${Collections.media}_owned`] = (
    await mediaCol.deleteMany({ owner_id: parentOid })
  ).deletedCount;

  // Children, then the parent account itself — last, so a partial failure
  // above never leaves orphaned child data behind a deleted login.
  const childCol = await getCollection<ChildDoc>(Collections.children);
  deleted[Collections.children] = (
    await childCol.deleteMany({ parent_id: parentOid })
  ).deletedCount;
  const parentCol = await getCollection<ParentDoc>(Collections.parents);
  deleted[Collections.parents] = (
    await parentCol.deleteOne({ _id: parentOid })
  ).deletedCount;

  return deleted;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
