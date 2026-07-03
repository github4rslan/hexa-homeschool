import "server-only";
import { ObjectId } from "mongodb";
import { getCollection, Collections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth/session";
import { computeStreak } from "@/lib/engine/streak";
import { sha256Hex } from "@/lib/compliance/portfolio";
import {
  buildInsights,
  classifyTopicStanding,
  type Insight,
  type LessonSample,
  type MoodSample,
} from "@/lib/engine/insights";
import {
  scheduleFirstReview,
  nextReview,
  isReviewDue,
} from "@/lib/engine/spaced-repetition";
import { shouldQueueHandoff } from "@/lib/engine/remediation";
import type {
  ParentDoc,
  ChildDoc,
  EvaluationDoc,
  LessonLogDoc,
  LessonProgressDoc,
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
  MessageDoc,
  StaffAuditLogDoc,
  ParentEventDoc,
  ReengagementEventDoc,
  FeedbackDoc,
  Subject,
} from "./types";
import type { ReengStage, ReengTrack } from "@/lib/engine/reengagement";
import type {
  FeedbackPromptState,
  FeedbackMilestoneSignal,
  FeedbackTrigger,
} from "@/lib/engine/feedback-eligibility";
import { resolveRole, type StaffRole } from "@/lib/auth/rbac";
import {
  evaluateRoleChange,
  evaluateAccountAction,
  confirmationMatches,
  requireReason,
  type NextRole,
  type GuardResult,
} from "@/lib/auth/staff-guards";
import { isKnownFlag } from "@/lib/admin/feature-flags";
import type {
  BillingRow,
  BillingStatus,
  SubscriptionTier,
} from "@/lib/metrics/finance";
import {
  ageFromDob,
  placeChild,
  type KeyStage,
} from "@/lib/engine/diagnostic-placement";
import { currentBandFrom } from "@/lib/engine/band-progression";
import {
  periodWindowFromWeekStart,
  mockPeriodKey,
} from "@/lib/engine/assessment-period";
import { isDuplicateKeyError } from "@/lib/db/mongo-errors";

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

/**
 * Mark a parent's email verified. Returns true only when this call actually
 * flipped an unverified account to verified — so a caller can treat the
 * transition as single-use (the stateless verification link must not mint a
 * fresh session on replay). Idempotent: a second call returns false.
 */
export async function markEmailVerified(parentId: string): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne(
    { _id: oid, email_verified: { $ne: true } },
    { $set: { email_verified: true, updated_at: new Date() } },
  );
  return res.modifiedCount > 0;
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
  // Throttled parent-activity heartbeat (drives the re-engagement series). At
  // most one write/hour, gated on the already-loaded doc so hot requests skip
  // the DB entirely. Best-effort: a write hiccup must never sign a parent out.
  await touchParentActivity(parent).catch(() => {});
  return session.id;
}

/** At most once/hour, advance the parent's `last_active` heartbeat. */
const ACTIVITY_THROTTLE_MS = 60 * 60 * 1000;
async function touchParentActivity(parent: ParentDoc): Promise<void> {
  if (!parent._id) return;
  const now = Date.now();
  const last = parent.last_active ? parent.last_active.getTime() : 0;
  if (now - last < ACTIVITY_THROTTLE_MS) return; // still fresh — no write
  const cutoff = new Date(now - ACTIVITY_THROTTLE_MS);
  const col = await getCollection<ParentDoc>(Collections.parents);
  // Conditional on staleness so concurrent requests race to a single write.
  await col.updateOne(
    {
      _id: parent._id,
      $or: [
        { last_active: { $exists: false } },
        { last_active: { $lte: cutoff } },
      ],
    },
    { $set: { last_active: new Date(now) } },
  );
}

/** Advance `last_active` to now unconditionally (test/seed/smoke helper). */
export async function setParentLastActive(
  parentId: string,
  when: Date = new Date(),
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne({ _id: oid }, { $set: { last_active: when } });
  return res.matchedCount > 0;
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

/**
 * Set the diagnostic-completion timestamp ONCE — the first full completion is
 * the baseline; an existing value is never overwritten. `claimed` is true only
 * for the request that acquired the atomic lock, so concurrent or late submits
 * cannot both insert a baseline. Ownership enforced.
 */
export async function markDiagnosticCompleted(
  parentId: string,
  childId: ObjectId,
): Promise<{ at: Date | null; claimed: boolean }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { at: null, claimed: false };
  }
  const col = await getCollection<ChildDoc>(Collections.children);
  const now = new Date();
  const result = await col.updateOne(
    {
      _id: childId,
      $or: [
        { diagnostic_completed_at: { $exists: false } },
        { diagnostic_completed_at: null },
      ],
    },
    { $set: { diagnostic_completed_at: now, updated_at: now } },
  );
  const doc = await col.findOne({ _id: childId });
  return {
    at: doc?.diagnostic_completed_at ?? null,
    claimed: result.modifiedCount === 1,
  };
}

/**
 * Release a just-acquired diagnostic lock when its baseline write is rejected.
 * Matching the exact timestamp prevents this request clearing another lock.
 */
export async function releaseDiagnosticCompletion(
  parentId: string,
  childId: ObjectId,
  claimedAt: Date,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<ChildDoc>(Collections.children);
  const result = await col.updateOne(
    { _id: childId, diagnostic_completed_at: claimedAt },
    { $set: { diagnostic_completed_at: null, updated_at: new Date() } },
  );
  return result.modifiedCount === 1;
}

/**
 * Parent-scoped diagnostic restart. Deletes only non-mock baseline evaluations
 * and re-opens the set-once completion flag; mock-exam history is untouched.
 */
export async function restartDiagnosticBaseline(
  parentId: string,
  childId: ObjectId,
): Promise<{ ok: boolean; deletedBaselineCount: number }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { ok: false, deletedBaselineCount: 0 };
  }

  // Keep the child locked while old baseline rows are removed. Clearing the
  // flag is the final write that deliberately re-opens the diagnostic.
  const evaluations = await getCollection<EvaluationDoc>(Collections.evaluations);
  const deleted = await evaluations.deleteMany({
    child_id: childId,
    mock_exam: false,
  });
  const children = await getCollection<ChildDoc>(Collections.children);
  const updated = await children.updateOne(
    { _id: childId },
    {
      $set: {
        diagnostic_completed_at: null,
        updated_at: new Date(),
      },
    },
  );

  return {
    ok: updated.matchedCount === 1,
    deletedBaselineCount: deleted.deletedCount,
  };
}

/**
 * Whether the active child has completed the one-time diagnostic, with the
 * timestamp. Legacy-safe: a child with prior non-mock evaluations but no flag
 * counts as completed, and the flag is BACK-FILLED to the earliest such result
 * so the baseline date stays stable. Ownership enforced.
 */
export async function getDiagnosticCompletion(
  parentId: string,
  childId: ObjectId,
): Promise<{ completed: boolean; at: Date | null }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { completed: false, at: null };
  }
  const col = await getCollection<ChildDoc>(Collections.children);
  const child = await col.findOne({ _id: childId });
  if (child?.diagnostic_completed_at) {
    return { completed: true, at: child.diagnostic_completed_at };
  }
  // Legacy inference + back-fill from the earliest non-mock evaluation.
  const evalCol = await getCollection<EvaluationDoc>(Collections.evaluations);
  const firstEval = await evalCol.findOne(
    { child_id: childId, mock_exam: false },
    { sort: { created_at: 1 } },
  );
  if (firstEval) {
    const at = firstEval.created_at;
    await col.updateOne(
      {
        _id: childId,
        $or: [
          { diagnostic_completed_at: { $exists: false } },
          { diagnostic_completed_at: null },
        ],
      },
      { $set: { diagnostic_completed_at: at } },
    );
    return { completed: true, at };
  }
  return { completed: false, at: null };
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
  /** True when the latest result for this subject came from a mock exam. */
  fromMock: boolean;
  /** When the latest result was recorded (for parent context), or null. */
  assessedAt: Date | null;
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
        fromMock: doc?.mock_exam === true,
        assessedAt: doc?.created_at ?? null,
      };
    }),
  );
}

export interface EvaluationPoint {
  subject: Subject;
  /** Numeric GCSE grade parsed from model_predicted_grade (top of a band). */
  grade: number;
  mock: boolean;
  at: Date;
}

/**
 * Chronological evaluation history (diagnostics + mocks) for a child, one point
 * per record that has a parseable predicted grade. Powers the readiness
 * trajectory chart — pure data, no AI.
 */
export async function evaluationHistory(
  childId: ObjectId,
): Promise<EvaluationPoint[]> {
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  const docs = await col
    .find({ child_id: childId })
    .sort({ created_at: 1 })
    .toArray();
  const points: EvaluationPoint[] = [];
  for (const d of docs) {
    if (!d.subject || !d.model_predicted_grade) continue;
    // Grades may be a band like "Grade 4–5" or a bare number; take the highest.
    const nums = d.model_predicted_grade.match(/\d+/g);
    if (!nums?.length) continue;
    const grade = Math.max(...nums.map(Number));
    if (!Number.isFinite(grade)) continue;
    points.push({
      subject: d.subject,
      grade,
      mock: d.mock_exam === true,
      at: d.created_at,
    });
  }
  return points;
}

export interface MonthlyReport {
  childName: string;
  /** "June 2026" */
  periodLabel: string;
  monthStart: Date;
  monthEnd: Date;
  lessonsCompleted: number;
  topicsCertified: { title: string; subject: Subject }[];
  evaluations: { subject: Subject; grade: string | null; mock: boolean; at: Date }[];
  /** Distinct UTC days with a completed lesson this month. */
  activeDays: number;
  /** Next up to 3 uncertified topics across subjects (next month's focus). */
  nextFocus: { title: string; subject: Subject }[];
  generatedAt: Date;
}

/**
 * Aggregate one calendar month of a child's activity for the monthly progress
 * report / local-authority evidence. Ownership enforced. `year`/`month` are
 * UTC (month 0–11).
 */
export async function monthlyReport(
  parentId: string,
  childId: ObjectId,
  year: number,
  month: number,
): Promise<MonthlyReport | null> {
  if (!(await assertOwnsChild(parentId, childId))) return null;

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const child = await getChildById(parentId, childId.toHexString());
  if (!child) return null;

  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const evalCol = await getCollection<EvaluationDoc>(Collections.evaluations);
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);

  const logs = await logsCol
    .find({
      child_id: childId,
      status: "completed",
      timestamp_end: { $gte: monthStart, $lt: monthEnd },
    })
    .toArray();
  const lessonsCompleted = logs.length;
  const activeDays = new Set(
    logs
      .filter((l) => l.timestamp_end)
      .map((l) =>
        Math.floor(new Date(l.timestamp_end as Date).getTime() / 86_400_000),
      ),
  ).size;

  // Topics certified WITHIN the month.
  const certifiedThisMonth = await compCol
    .find({
      child_id: childId,
      state: "certified",
      certified_at: { $gte: monthStart, $lt: monthEnd },
    })
    .toArray();
  const certTags = certifiedThisMonth.map((c) => c.topic_tag);
  const certTopics =
    certTags.length > 0
      ? await topicsCol.find({ topic_tag: { $in: certTags } }).toArray()
      : [];
  const topicsCertified = certTopics.map((t) => ({ title: t.title, subject: t.subject }));

  // Evaluations recorded within the month.
  const evals = await evalCol
    .find({ child_id: childId, created_at: { $gte: monthStart, $lt: monthEnd } })
    .sort({ created_at: 1 })
    .toArray();
  const evaluations = evals
    .filter((e) => e.subject)
    .map((e) => ({
      subject: e.subject as Subject,
      grade: e.model_predicted_grade ?? null,
      mock: e.mock_exam === true,
      at: e.created_at,
    }));

  // Next month's focus: next uncertified topic per subject, WITHIN the child's
  // current band (same band-aware selection the weekly plan uses).
  const allCertified = new Set(
    (await compCol.find({ child_id: childId, state: "certified" }).toArray()).map(
      (c) => c.topic_tag,
    ),
  );
  const floor: KeyStage = childFloorBand(child.date_of_birth);
  const allTopics = await topicsCol.find({}).sort({ order: 1 }).toArray();
  const subjects: Subject[] = ["mathematics", "english", "science"];
  const nextFocus: { title: string; subject: Subject }[] = [];
  for (const subj of subjects) {
    const band = bandFromData(floor, subj, allTopics, allCertified);
    const inBand = allTopics.filter(
      (t) => t.subject === subj && (t.key_stage ?? 4) === band,
    );
    const next = inBand.find((t) => !allCertified.has(t.topic_tag));
    if (next) nextFocus.push({ title: next.title, subject: subj });
  }

  return {
    childName: child.full_name,
    periodLabel: monthStart.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    monthStart,
    monthEnd,
    lessonsCompleted,
    topicsCertified,
    evaluations,
    activeDays,
    nextFocus,
    generatedAt: new Date(),
  };
}

export interface WeekInReview {
  childId: string;
  childName: string;
  /** ISO Monday date of the week summarised. */
  weekStart: string;
  /** "2 – 8 June" style label. */
  weekLabel: string;
  lessonsCompleted: number;
  topicsCertified: string[];
  streak: number;
  /** Subject with the most lessons this week, display label, or null. */
  bestSubject: string | null;
  totalMinutes: number;
  activeDays: number;
  /** True when the week had no completed lessons (drives a gentle empty slide). */
  quiet: boolean;
}

/**
 * "Week in Review" aggregate for one child — the current Monday→Sunday window,
 * derived entirely from existing collections (no new schema). Powers the parent
 * card, the child-mode celebration, and the shareable image. Ownership enforced.
 */
export async function weekInReview(
  parentId: string,
  child: ChildDoc,
): Promise<WeekInReview | null> {
  const childId = child._id!;
  if (!(await assertOwnsChild(parentId, childId))) return null;

  const weekStart = currentWeekStart();
  // Parse as UTC (matching periodWindowFromWeekStart and the London-anchored
  // week math); a bare "T00:00:00" would parse in the server's local tz and
  // mis-slice the week window on a non-UTC host.
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);

  const [logs, certified, streak] = await Promise.all([
    logsCol
      .find({
        child_id: childId,
        status: "completed",
        timestamp_end: { $gte: start, $lt: end },
      })
      .toArray(),
    compCol
      .find({
        child_id: childId,
        state: "certified",
        certified_at: { $gte: start, $lt: end },
      })
      .toArray(),
    childStreak(childId),
  ]);

  const lessonsCompleted = logs.length;

  // Total minutes from logged durations (guard against missing/negative spans).
  const totalSeconds = logs.reduce((sum, l) => {
    if (!l.timestamp_end) return sum;
    const s =
      (new Date(l.timestamp_end).getTime() - new Date(l.timestamp_start).getTime()) /
      1000;
    return sum + (s > 0 ? s : 0);
  }, 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const activeDays = new Set(
    logs
      .filter((l) => l.timestamp_end)
      .map((l) => Math.floor(new Date(l.timestamp_end as Date).getTime() / 86_400_000)),
  ).size;

  // Best subject = most lessons this week (resolve each log's topic → subject).
  const certTags = certified.map((c) => c.topic_tag);
  const logTags = Array.from(new Set(logs.map((l) => l.topic_tag).concat(certTags)));
  const topicDocs =
    logTags.length > 0
      ? await topicsCol.find({ topic_tag: { $in: logTags } }).toArray()
      : [];
  const subjectByTag = new Map(topicDocs.map((t) => [t.topic_tag, t.subject]));
  const titleByTag = new Map(topicDocs.map((t) => [t.topic_tag, t.title]));

  const subjectCounts = new Map<Subject, number>();
  for (const l of logs) {
    const subj = subjectByTag.get(l.topic_tag);
    if (subj) subjectCounts.set(subj, (subjectCounts.get(subj) ?? 0) + 1);
  }
  let bestSubject: string | null = null;
  let bestCount = 0;
  for (const [subj, count] of subjectCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestSubject = SUBJECT_DISPLAY[subj];
    }
  }

  const topicsCertified = certTags
    .map((t) => titleByTag.get(t))
    .filter((t): t is string => Boolean(t));

  const weekLabel = `${start.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} – ${new Date(end.getTime() - 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;

  return {
    childId: childId.toHexString(),
    childName: child.full_name,
    weekStart,
    weekLabel,
    lessonsCompleted,
    topicsCertified,
    streak: streak.current,
    bestSubject,
    totalMinutes,
    activeDays,
    quiet: lessonsCompleted === 0,
  };
}

export interface SubjectMilestone {
  subject: Subject;
  label: string;
  certified: number;
  total: number;
  /** True when every topic in the subject is certified (certificate-eligible). */
  complete: boolean;
}

/**
 * Per-subject certification milestones for a child: how many topics are
 * certified vs the subject's total, and whether the subject is fully complete.
 * Drives the "earned certificates" list on the portfolio page. Ownership
 * enforced.
 */
export async function subjectMilestones(
  parentId: string,
  childId: ObjectId,
): Promise<SubjectMilestone[]> {
  if (!(await assertOwnsChild(parentId, childId))) return [];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const [topics, comps] = await Promise.all([
    topicsCol.find({}).toArray(),
    compCol.find({ child_id: childId, state: "certified" }).toArray(),
  ]);
  const certifiedTags = new Set(comps.map((c) => c.topic_tag));
  const subjects: Subject[] = ["mathematics", "english", "science"];
  return subjects.map((subject) => {
    const subjectTopics = topics.filter((t) => t.subject === subject);
    const certified = subjectTopics.filter((t) =>
      certifiedTags.has(t.topic_tag),
    ).length;
    const total = subjectTopics.length;
    return {
      subject,
      label: SUBJECT_DISPLAY[subject],
      certified,
      total,
      complete: total > 0 && certified === total,
    };
  });
}

export interface DailySummaryData {
  childFirstName: string;
  today: {
    lessonsCompleted: number;
    topics: { title: string; mastered: boolean }[];
  };
  subjects: { label: string; certified: number; total: number }[];
  streak: number;
  /** Plain-English working stage ("primary level" …), or null when unknown. */
  stageLabel: string | null;
}

/** Map a UK key stage to the plain-English working stage used in parent copy. */
const STAGE_LABEL: Record<number, string> = {
  2: "primary level",
  3: "lower-secondary level",
  4: "GCSE level",
};

/**
 * Deterministic facts for the parent's daily progress summary: today's
 * completed lessons (with per-topic mastery outcome), per-subject competence so
 * far, the current streak, and the child's working stage. No AI, no comparison
 * to other children. Ownership enforced; returns null when the caller doesn't
 * own the child.
 */
export async function dailySummaryData(
  parentId: string,
  child: ChildDoc,
): Promise<DailySummaryData | null> {
  const childId = child._id!;
  if (!(await assertOwnsChild(parentId, childId))) return null;

  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);

  const dayStart = londonDayStart();

  const [topics, comps, todayLogs, streak] = await Promise.all([
    topicsCol.find({}).toArray(),
    compCol.find({ child_id: childId }).toArray(),
    logsCol
      .find({
        child_id: childId,
        status: "completed",
        timestamp_end: { $gte: dayStart },
      })
      .toArray(),
    childStreak(childId),
  ]);

  const titleByTag = new Map(topics.map((t) => [t.topic_tag, t.title]));
  const keyStageByTag = new Map(topics.map((t) => [t.topic_tag, t.key_stage]));

  // Today's per-topic outcome: keep the best mastery seen per topic today.
  const bestMastery = new Map<string, number>();
  for (const l of todayLogs) {
    const m = l.mastery_score ?? 0;
    bestMastery.set(l.topic_tag, Math.max(bestMastery.get(l.topic_tag) ?? 0, m));
  }
  const todayTopics = [...bestMastery.entries()].map(([tag, mastery]) => ({
    title: titleByTag.get(tag) ?? tag,
    mastered: mastery >= 100,
  }));

  // Per-subject competence so far.
  const certifiedTags = new Set(
    comps.filter((c) => c.state === "certified").map((c) => c.topic_tag),
  );
  const subjectList: Subject[] = ["mathematics", "english", "science"];
  const subjects = subjectList.map((subject) => {
    const subjectTopics = topics.filter((t) => t.subject === subject);
    return {
      label: SUBJECT_DISPLAY[subject],
      certified: subjectTopics.filter((t) => certifiedTags.has(t.topic_tag)).length,
      total: subjectTopics.length,
    };
  });

  // Working stage = highest key stage the child has reached (training/certified).
  let highestStage = 0;
  for (const c of comps) {
    if (c.state === "training" || c.state === "certified") {
      highestStage = Math.max(highestStage, keyStageByTag.get(c.topic_tag) ?? 0);
    }
  }
  const stageLabel = STAGE_LABEL[highestStage] ?? null;

  return {
    childFirstName: child.full_name.split(" ")[0],
    today: { lessonsCompleted: todayLogs.length, topics: todayTopics },
    subjects,
    streak: streak.current,
    stageLabel,
  };
}

export interface MasteryCertificate {
  childFirstName: string;
  subjectLabel: string;
  topicsCertified: number;
  /** Most recent certification date in the subject (the achievement date). */
  achievedAt: Date;
  /** Tamper-evident SHA-256 over the certificate facts (ties to compliance). */
  verificationHash: string;
}

/**
 * Build a print-ready mastery certificate for a fully-certified subject. The
 * verification hash is SHA-256 over the canonical facts (child first name,
 * subject, topic count, date) so it can be cross-checked — the same trust
 * primitive as the compliance dossiers. Returns null unless the subject is
 * complete. Ownership enforced.
 */
export async function masteryCertificate(
  parentId: string,
  child: ChildDoc,
  subject: Subject,
): Promise<MasteryCertificate | null> {
  const childId = child._id!;
  if (!(await assertOwnsChild(parentId, childId))) return null;

  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const subjectTopics = await topicsCol.find({ subject }).toArray();
  if (subjectTopics.length === 0) return null;
  const tags = subjectTopics.map((t) => t.topic_tag);

  const certified = await compCol
    .find({ child_id: childId, state: "certified", topic_tag: { $in: tags } })
    .toArray();
  if (certified.length !== subjectTopics.length) return null; // not complete

  const achievedAt = certified.reduce<Date>((latest, c) => {
    const d = c.certified_at ? new Date(c.certified_at) : new Date(0);
    return d > latest ? d : latest;
  }, new Date(0));

  const firstName = child.full_name.split(" ")[0];
  const subjectLabel = SUBJECT_DISPLAY[subject];
  const verificationHash = await sha256Hex(
    JSON.stringify({
      kind: "mastery-certificate",
      childFirstName: firstName,
      subject,
      topics: subjectTopics.length,
      achievedAt: achievedAt.toISOString().slice(0, 10),
    }),
  );

  return {
    childFirstName: firstName,
    subjectLabel,
    topicsCertified: subjectTopics.length,
    achievedAt,
    verificationHash,
  };
}

/**
 * Deterministic learning insights for a child's detail page. Pulls completed
 * lessons + check-ins, hands them to the pure `buildInsights` engine, and
 * returns plain-English pattern lines. Never compares children. Ownership
 * enforced. Looks back 180 days, ample for a meaningful sample.
 */
export async function childInsights(
  parentId: string,
  childId: ObjectId,
): Promise<{ insights: Insight[]; learning: boolean }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { insights: [], learning: true };
  }
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const checkinsCol = await getCollection<CheckinDoc>(Collections.checkins);

  const [logs, checkins] = await Promise.all([
    logsCol
      .find({ child_id: childId, status: "completed", timestamp_end: { $gte: since } })
      .toArray(),
    checkinsCol.find({ child_id: childId, created_at: { $gte: since } }).toArray(),
  ]);

  const lessons: LessonSample[] = logs.map((l) => ({
    hour: l.timestamp_end ? new Date(l.timestamp_end).getHours() : 12,
    mastery: typeof l.mastery_score === "number" ? l.mastery_score : null,
    hintsUsed: l.hints_counter ?? 0,
    certified: (l.mastery_score ?? 0) >= 100,
  }));

  // Per-day average mastery, to pair with each check-in's day.
  const dayMastery = new Map<number, number[]>();
  for (const l of logs) {
    if (typeof l.mastery_score !== "number" || !l.timestamp_end) continue;
    const day = Math.floor(new Date(l.timestamp_end).getTime() / 86_400_000);
    const arr = dayMastery.get(day) ?? [];
    arr.push(l.mastery_score);
    dayMastery.set(day, arr);
  }
  const moods: MoodSample[] = checkins.map((c) => {
    const day = Math.floor(new Date(c.created_at).getTime() / 86_400_000);
    const arr = dayMastery.get(day);
    return {
      mood: c.mood,
      dayMastery: arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null,
    };
  });

  return buildInsights(lessons, moods);
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

// ── Within-lesson autosave / resume (interactive daily flow) ──

/**
 * Save the child's mid-lesson position so an interruption resumes at the exact
 * step. Upsert keyed on (child, topic). Pedagogical state only — never
 * analytics. Ownership enforced.
 */
export async function saveLessonProgress(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
  progress: { step: number; score: number; total: number },
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<LessonProgressDoc>(Collections.lessonProgress);
  await col.updateOne(
    { child_id: childId, topic_tag: topicTag },
    {
      $set: {
        step: progress.step,
        score: progress.score,
        total: progress.total,
        updated_at: new Date(),
      },
    },
    { upsert: true },
  );
  return true;
}

/** Read saved mid-lesson progress for a topic, or null. Ownership enforced. */
export async function getLessonProgress(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
): Promise<{ step: number; score: number; total: number } | null> {
  if (!(await assertOwnsChild(parentId, childId))) return null;
  const col = await getCollection<LessonProgressDoc>(Collections.lessonProgress);
  const doc = await col.findOne({ child_id: childId, topic_tag: topicTag });
  if (!doc) return null;
  return { step: doc.step, score: doc.score, total: doc.total };
}

/**
 * Clear saved progress (on completion, so a finished lesson never resumes).
 * Ownership enforced.
 */
export async function clearLessonProgress(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
): Promise<void> {
  if (!(await assertOwnsChild(parentId, childId))) return;
  const col = await getCollection<LessonProgressDoc>(Collections.lessonProgress);
  await col.deleteOne({ child_id: childId, topic_tag: topicTag });
}

export async function upsertCompetence(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
  state: CompetenceDoc["state"],
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<CompetenceDoc>(Collections.competence);

  // Schedule the first spaced-repetition review only on a FRESH certification
  // (a topic moving into "certified" that wasn't already certified). Re-running
  // a certified topic must not reset its review schedule.
  const set: Partial<CompetenceDoc> = {
    state,
    certified_at: state === "certified" ? new Date() : null,
    updated_at: new Date(),
  };
  if (state === "certified") {
    const existing = await col.findOne({ child_id: childId, topic_tag: topicTag });
    if (existing?.state !== "certified") {
      const sched = scheduleFirstReview();
      set.next_review_at = sched.nextReviewAt;
      set.review_interval_days = sched.intervalDays;
    }
  }

  await col.updateOne(
    { child_id: childId, topic_tag: topicTag },
    { $set: set },
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
  /** When the next spaced-repetition review is scheduled (certified topics). */
  nextReviewAt: Date | null;
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
      nextReviewAt: c?.next_review_at ?? null,
    });
  }
  return result;
}

/**
 * Topic tags the child completed a lesson on TODAY (UTC-day), so the daily-quest
 * cards can show a checkmark per subject the child has already done today.
 */
export async function todaysCompletedTopicTags(
  childId: ObjectId,
): Promise<Set<string>> {
  const start = londonDayStart();
  const col = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const logs = await col
    .find({
      child_id: childId,
      status: "completed",
      timestamp_end: { $gte: start },
    })
    .project<{ topic_tag: string }>({ topic_tag: 1 })
    .toArray();
  return new Set(logs.map((l) => l.topic_tag));
}

/**
 * Current learning streak for a child, computed from completed lesson logs
 * (UTC-day buckets, one grace day per week — see `lib/engine/streak.ts`).
 * Looks back 120 days, which comfortably covers any live streak.
 */
export async function childStreak(
  childId: ObjectId,
): Promise<{ current: number; completedToday: boolean }> {
  const col = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
  const logs = await col
    .find({
      child_id: childId,
      status: "completed",
      timestamp_end: { $gte: since },
    })
    .project<{ timestamp_end: Date }>({ timestamp_end: 1 })
    .toArray();
  return computeStreak(logs.map((l) => new Date(l.timestamp_end).getTime()));
}

export interface TodayQuest {
  subject: Subject;
  topicTag: string;
  topicTitle: string;
  done: boolean;
}

export interface TodayCard {
  childId: string;
  childName: string;
  /** Today's quests, mirroring the approved weekly plan (same topic/day). */
  quests: TodayQuest[];
  streak: number;
  completedToday: boolean;
  reviewsDue: number;
  openEscalations: number;
  /** Subject just certified today, if any — drives the quiet "all done" line. */
  certifiedToday: string | null;
  allDone: boolean;
  /**
   * Topics resting for a five-attempt human handoff (Wave 7, Phase 4). Excluded
   * from `quests` (the syllabus pauses them without shame) and surfaced
   * separately so the parent sees "paused — a tutor is coming", not a failure.
   */
  pausedTopics: { topicTag: string; topicTitle: string }[];
}

/**
 * The 10-second daily glance for one child, derived entirely from real data:
 * today's plan-mirrored quests with live done-state, current streak, reviews
 * due, and any open escalation. Pure read; ownership enforced by the caller
 * resolving the child from the parent's own children.
 */
export async function todayCard(
  parentId: string,
  child: ChildDoc,
): Promise<TodayCard> {
  const childId = child._id!;
  const [schedule, doneTags, streak, comps, escalations, topics] =
    await Promise.all([
      getWeeklySchedule(parentId, childId),
      todaysCompletedTopicTags(childId),
      childStreak(childId),
      (await getCollection<CompetenceDoc>(Collections.competence))
        .find({ child_id: childId })
        .toArray(),
      openEscalations([childId]),
      listTopics(),
    ]);

  const titleByTag = new Map(topics.map((t) => [t.topic_tag, t.title]));
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Monday

  // Topics resting for a tutor handoff are set aside: excluded from today's
  // quests (so "all done" / the daily summary never block on them) and surfaced
  // separately as a calm "paused" signal.
  const pausedTags = new Set(
    comps.filter((c) => c.tutor_paused_at).map((c) => c.topic_tag),
  );
  const pausedTopics = [...pausedTags].map((tag) => ({
    topicTag: tag,
    topicTitle: titleByTag.get(tag) || tag,
  }));

  const quests: TodayQuest[] = (schedule?.items ?? [])
    .filter((it) => it.day === todayIndex && !pausedTags.has(it.topic_tag))
    .map((it) => ({
      subject: it.subject,
      topicTag: it.topic_tag,
      topicTitle: it.topic_title || titleByTag.get(it.topic_tag) || it.topic_tag,
      done: doneTags.has(it.topic_tag),
    }));

  const reviewsDue = comps.filter(
    (c) => c.state === "certified" && isReviewDue(c.next_review_at),
  ).length;

  // A subject certified today (for the quiet celebration line).
  const start = londonDayStart();
  let certifiedToday: string | null = null;
  for (const c of comps) {
    if (
      c.state === "certified" &&
      c.certified_at &&
      new Date(c.certified_at) >= start
    ) {
      certifiedToday = titleByTag.get(c.topic_tag) ?? null;
      if (certifiedToday) break;
    }
  }

  const allDone = quests.length > 0 && quests.every((q) => q.done);

  return {
    childId: childId.toHexString(),
    childName: child.full_name,
    quests,
    streak: streak.current,
    completedToday: streak.completedToday,
    reviewsDue,
    openEscalations: escalations.length,
    certifiedToday,
    allDone,
    pausedTopics,
  };
}

// ── Mock exams ───────────────────────────────────────────

export interface MockQuestion {
  questionId: string;
  topicTag: string;
  tier: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Build a mock-exam paper for a subject: up to `count` human-authored questions
 * drawn across the child's training/certified topics in that subject, spread
 * over difficulty tiers. If the child has little progress yet, falls back to the
 * subject's questions generally so a mock is always runnable. Deterministic
 * source content; never AI-authored.
 */
export async function buildMockPaper(
  childId: ObjectId,
  subject: Subject,
  count = 10,
): Promise<MockQuestion[]> {
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const qCol = await getCollection<QuestionDoc>(Collections.questions);

  const subjectTopics = await topicsCol.find({ subject }).toArray();
  const subjectTags = new Set(subjectTopics.map((t) => t.topic_tag));

  const comps = await compCol
    .find({
      child_id: childId,
      state: { $in: ["training", "certified"] },
      topic_tag: { $in: [...subjectTags] },
    })
    .toArray();
  const progressedTags = comps.map((c) => c.topic_tag);

  const tagFilter =
    progressedTags.length > 0 ? progressedTags : [...subjectTags];

  const pool = await qCol
    .find({
      subject,
      topic_tag: { $in: tagFilter },
      kind: { $in: ["practice", "mastery"] },
    })
    .toArray();

  // Spread by tier for a fair paper: sort by tier then take an even sample.
  pool.sort((a, b) => a.tier - b.tier);
  const picked: QuestionDoc[] = [];
  if (pool.length <= count) {
    picked.push(...pool);
  } else {
    const step = pool.length / count;
    for (let i = 0; i < count; i++) picked.push(pool[Math.floor(i * step)]);
  }

  return picked
    .filter((q) => q._id)
    .map((q) => ({
      questionId: q._id!.toHexString(),
      topicTag: q.topic_tag,
      tier: q.tier,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation,
    }));
}

/**
 * Persist a completed mock exam as an EvaluationDoc with mock_exam: true, so
 * the exam-decision engine and parent trajectory see real assessment data.
 * Ownership enforced. Returns false if the child isn't owned.
 */
export async function recordMockResult(
  parentId: string,
  childId: ObjectId,
  input: {
    subject: Subject;
    scorePct: number;
    estimatedTier: number;
    indicativeGrade: string;
  },
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  // Integrity: one honest attempt per subject per period. Refuse a second write
  // for this child + subject within the current period (a double-click /
  // browser-back can't chase a better grade). The first attempt is the record.
  if (await hasMockThisPeriodInternal(childId, input.subject)) return false;
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  // The read-check above is advisory; two concurrent submits can both pass it.
  // mock_period + the unique (child_id, subject, mock_period) index make the
  // insert the real arbiter: the losing racer gets E11000 and we return false.
  try {
    await col.insertOne({
      child_id: childId,
      subject: input.subject,
      raw_score: input.scorePct,
      model_predicted_grade: input.indicativeGrade,
      confidence_interval: Math.min(0.99, Math.max(0.5, input.scorePct / 100)),
      mock_exam: true,
      mock_period: mockPeriodKey(currentWeekStart()),
      created_at: new Date(),
    } as EvaluationDoc);
    return true;
  } catch (err) {
    if (isDuplicateKeyError(err)) return false; // already recorded this period
    throw err;
  }
}

// ── Mock attempt lock (one honest attempt per subject per period) ──

export interface MockSubjectState {
  subject: Subject;
  taken: boolean;
  /** This period's recorded result, read back (never a recomputation). */
  result: { scorePct: number; indicativeGrade: string } | null;
  /** When the next attempt unlocks (start of the next period). */
  nextAvailable: Date;
}

/** This period's first mock evaluation for a child + subject, or null. */
async function mockThisPeriod(
  childId: ObjectId,
  subject: Subject,
): Promise<EvaluationDoc | null> {
  const { start, next } = periodWindowFromWeekStart(currentWeekStart());
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  return col.findOne(
    {
      child_id: childId,
      subject,
      mock_exam: true,
      created_at: { $gte: start, $lt: next },
    },
    { sort: { created_at: 1 } }, // the first attempt of the period is the record
  );
}

/** Internal (no ownership check) — only called from owned contexts. */
async function hasMockThisPeriodInternal(
  childId: ObjectId,
  subject: Subject,
): Promise<boolean> {
  return !!(await mockThisPeriod(childId, subject));
}

/**
 * Per-subject mock state for the active child this period: taken?, the recorded
 * result, and when the next attempt unlocks. Ownership enforced.
 */
export async function getMockState(
  parentId: string,
  childId: ObjectId,
): Promise<MockSubjectState[]> {
  const { next } = periodWindowFromWeekStart(currentWeekStart());
  const subjects: Subject[] = ["mathematics", "english", "science"];
  if (!(await assertOwnsChild(parentId, childId))) {
    return subjects.map((subject) => ({
      subject,
      taken: false,
      result: null,
      nextAvailable: next,
    }));
  }
  return Promise.all(
    subjects.map(async (subject): Promise<MockSubjectState> => {
      const doc = await mockThisPeriod(childId, subject);
      return {
        subject,
        taken: !!doc,
        result: doc
          ? {
              scorePct: typeof doc.raw_score === "number" ? doc.raw_score : 0,
              indicativeGrade: doc.model_predicted_grade ?? "",
            }
          : null,
        nextAvailable: next,
      };
    }),
  );
}

/**
 * Whether the active child has already sat this period's mock for one subject,
 * with the recorded result + next-available date. Drives the run-page guard.
 * Ownership enforced.
 */
export async function hasMockThisPeriod(
  parentId: string,
  childId: ObjectId,
  subject: Subject,
): Promise<MockSubjectState> {
  const { next } = periodWindowFromWeekStart(currentWeekStart());
  if (!(await assertOwnsChild(parentId, childId))) {
    return { subject, taken: false, result: null, nextAvailable: next };
  }
  const doc = await mockThisPeriod(childId, subject);
  return {
    subject,
    taken: !!doc,
    result: doc
      ? {
          scorePct: typeof doc.raw_score === "number" ? doc.raw_score : 0,
          indicativeGrade: doc.model_predicted_grade ?? "",
        }
      : null,
    nextAvailable: next,
  };
}

// ── Spaced-repetition warm-up ────────────────────────────

export interface WarmupQuestion {
  topicTag: string;
  topicTitle: string;
  questionId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Up to `max` warm-up questions drawn from the child's certified topics whose
 * spaced-repetition review is due (legacy certified rows with no schedule count
 * as due). One human-authored question per due topic, easiest tier first. Pure
 * recall practice — never AI-authored.
 */
export async function dueReviewWarmup(
  childId: ObjectId,
  max = 3,
): Promise<WarmupQuestion[]> {
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const certified = await compCol
    .find({ child_id: childId, state: "certified" })
    .toArray();

  const dueTags = certified
    .filter((c) => isReviewDue(c.next_review_at))
    .map((c) => c.topic_tag);
  if (dueTags.length === 0) return [];

  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const qCol = await getCollection<QuestionDoc>(Collections.questions);

  const out: WarmupQuestion[] = [];
  for (const tag of dueTags) {
    if (out.length >= max) break;
    const topic = await topicsCol.findOne({ topic_tag: tag });
    const q = await qCol.findOne(
      { topic_tag: tag, kind: { $in: ["practice", "mastery"] } },
      { sort: { tier: 1 } },
    );
    if (!topic || !q || !q._id) continue;
    out.push({
      topicTag: tag,
      topicTitle: topic.title,
      questionId: q._id.toHexString(),
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation,
    });
  }
  return out;
}

/**
 * Record a warm-up review outcome: advance (correct → interval ×2, capped) or
 * reset (incorrect → 7 days) the topic's review schedule. NEVER changes the
 * competence state — certification is permanent; only the cadence moves.
 */
export async function recordReviewResult(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
  correct: boolean,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  const existing = await col.findOne({ child_id: childId, topic_tag: topicTag });
  if (!existing || existing.state !== "certified") return false;

  const sched = nextReview(existing.review_interval_days, correct);
  await col.updateOne(
    { child_id: childId, topic_tag: topicTag },
    {
      $set: {
        next_review_at: sched.nextReviewAt,
        review_interval_days: sched.intervalDays,
        updated_at: new Date(),
      },
    },
  );
  return true;
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
  const start = londonDayStart();
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

/**
 * Next topic in the subject's order after the given tag (for "continue").
 * Band-scoped: "continue" stays within the same key-stage band so a GCSE
 * lesson never hands a child a KS2 topic. Legacy topics (missing key_stage)
 * are treated as GCSE (4).
 */
export async function nextTopicAfter(
  topicTag: string,
): Promise<CurriculumTopicDoc | null> {
  const current = await getTopic(topicTag);
  if (!current) return null;
  const band = current.key_stage ?? 4;
  const col = await getCollection<CurriculumTopicDoc>(Collections.topics);
  return col.findOne(
    { subject: current.subject, key_stage: band, order: { $gt: current.order } },
    { sort: { order: 1 } },
  );
}

// ── Age-banding: which key-stage a child works in (Wave 3, Phase 2) ──

/** Warm, parent-facing key-stage labels. NEVER shown to a child. */
export const KEY_STAGE_LABEL: Record<KeyStage, string> = {
  2: "primary level",
  3: "lower-secondary level",
  4: "GCSE level",
};

/** The child's age-expected band floor, from DOB. Progression never goes below it. */
export function childFloorBand(dateOfBirth: string): KeyStage {
  return placeChild(ageFromDob(dateOfBirth)).keyStage;
}

/**
 * Resolve the band a child currently works in for a subject, given pre-fetched
 * topics + their certified topic_tags. Pure of further IO so callers that
 * already hold the data (the plan, the monthly report) avoid re-querying.
 */
function bandFromData(
  floor: KeyStage,
  subject: Subject,
  topics: CurriculumTopicDoc[],
  certified: Set<string>,
): KeyStage {
  return currentBandFrom(floor, (band) => {
    const bandTopics = topics.filter(
      (t) => t.subject === subject && (t.key_stage ?? 4) === band,
    );
    return (
      bandTopics.length === 0 || bandTopics.every((t) => certified.has(t.topic_tag))
    );
  });
}

/**
 * The band a child is CURRENTLY working in for a subject — the single source of
 * truth shared by the weekly plan, daily lessons, the monthly next-focus and
 * the parent's stage label. Starts at the age floor and advances past any band
 * whose topics are all certified (cross-band progression).
 */
export async function currentBandForSubject(
  childId: ObjectId,
  subject: Subject,
  floor: KeyStage,
): Promise<KeyStage> {
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const [topics, certifiedRows] = await Promise.all([
    topicsCol.find({ subject }).toArray(),
    compCol.find({ child_id: childId, state: "certified" }).toArray(),
  ]);
  const certified = new Set(certifiedRows.map((c) => c.topic_tag));
  return bandFromData(floor, subject, topics, certified);
}

/**
 * Per-subject current band for a child — parent-facing only. Powers the warm
 * "working level" label on the child profile (never shown to the child).
 * Ownership enforced.
 */
export async function childCurrentBands(
  parentId: string,
  childId: ObjectId,
): Promise<{ subject: Subject; keyStage: KeyStage }[]> {
  if (!(await assertOwnsChild(parentId, childId))) return [];
  const child = await getChildById(parentId, childId.toHexString());
  if (!child) return [];
  const floor = childFloorBand(child.date_of_birth);
  const subjects: Subject[] = ["mathematics", "english", "science"];
  const bands = await Promise.all(
    subjects.map((subject) => currentBandForSubject(childId, subject, floor)),
  );
  return subjects.map((subject, i) => ({ subject, keyStage: bands[i] }));
}

/**
 * The first uncertified topic for a child within their CURRENT band for a
 * subject (band-aware replacement for `firstTopic` in child flows). Falls back
 * to the band's first topic if all are certified, then null.
 */
export async function firstTopicInBandForChild(
  childId: ObjectId,
  subject: Subject,
  floor: KeyStage,
): Promise<CurriculumTopicDoc | null> {
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const [topics, certifiedRows] = await Promise.all([
    topicsCol.find({ subject }).sort({ order: 1 }).toArray(),
    compCol.find({ child_id: childId, state: "certified" }).toArray(),
  ]);
  const certified = new Set(certifiedRows.map((c) => c.topic_tag));
  const band = bandFromData(floor, subject, topics, certified);
  const inBand = topics.filter((t) => (t.key_stage ?? 4) === band);
  return inBand.find((t) => !certified.has(t.topic_tag)) ?? inBand[0] ?? null;
}

export async function getQuestions(
  filter: {
    topicTag?: string;
    subject?: Subject;
    kind?: QuestionDoc["kind"];
    tier?: number;
    /** Restrict to a key-stage band (daily lessons stay in the child's band). */
    keyStage?: number;
  },
  limit = 50,
): Promise<QuestionDoc[]> {
  const col = await getCollection<QuestionDoc>(Collections.questions);
  const query: Record<string, unknown> = {};
  if (filter.topicTag) query.topic_tag = filter.topicTag;
  if (filter.subject) query.subject = filter.subject;
  if (filter.kind) query.kind = filter.kind;
  if (typeof filter.tier === "number") query.tier = filter.tier;
  if (typeof filter.keyStage === "number") {
    // Legacy-safe: rows missing key_stage are treated as GCSE (4), so a band-4
    // fetch still includes them but a young band never inherits unlabelled items.
    if (filter.keyStage === 4) {
      query.$or = [{ key_stage: 4 }, { key_stage: { $exists: false } }];
    } else {
      query.key_stage = filter.keyStage;
    }
  }
  return col.find(query).limit(limit).toArray();
}

export async function getQuestionById(
  questionId: string,
): Promise<QuestionDoc | null> {
  const oid = toObjectId(questionId);
  if (!oid) return null;
  const col = await getCollection<QuestionDoc>(Collections.questions);
  return col.findOne({ _id: oid });
}

/**
 * The diagnostic item pool for a subject (kind=diagnostic), tier-ordered.
 *
 * Scoped to the child's key-stage band PLUS the adjacent harder band, so the
 * estimate has headroom for a precocious child (KS2 → KS2+KS3, KS3 → KS3+KS4,
 * KS4 → KS4). Legacy rows without a `key_stage` are treated as GCSE (4), so
 * they only surface when band 4 is in range. Defaults to KS4 (the prior
 * behaviour) when no band is supplied — e.g. a signed-out preview.
 */
export async function getDiagnosticPool(
  subject: Subject,
  keyStage = 4,
): Promise<QuestionDoc[]> {
  const col = await getCollection<QuestionDoc>(Collections.questions);
  // Band + one harder band of headroom; clamp into Edway's KS2–KS4 range.
  const base = Math.max(2, Math.min(4, keyStage));
  const bands = base >= 4 ? [4] : [base, base + 1];

  // Treat documents missing `key_stage` as GCSE (4) — include them only when
  // band 4 is in range, so a young child never inherits unlabelled GCSE items.
  const bandMatch: Record<string, unknown> = bands.includes(4)
    ? { $or: [{ key_stage: { $in: bands } }, { key_stage: { $exists: false } }] }
    : { key_stage: { $in: bands } };

  return col
    .find({ subject, kind: "diagnostic", ...bandMatch })
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

export interface AdminSubscriberRow {
  id: string;
  email: string;
  source: string;
  subscribedAt: string; // ISO date (yyyy-mm-dd), or "—"
}

export interface AdminSubscriberPage {
  rows: AdminSubscriberRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Newsletter subscribers for the admin list, newest first, paginated.
 * `newsletter` is the one public, non-child-scoped collection, so this is a
 * plain staff read (reached only through the (admin) layout's role gate) — no
 * ownership check applies. Returns email + source + signup date only, the only
 * fields the doc carries.
 */
export async function adminListNewsletterSubscribers({
  page = 1,
  pageSize = 50,
}: { page?: number; pageSize?: number } = {}): Promise<AdminSubscriberPage> {
  const col = await getCollection<{
    email: string;
    source?: string;
    created_at?: Date;
  }>(Collections.newsletter);
  const safePage = Math.max(1, page);
  const [total, docs] = await Promise.all([
    col.countDocuments(),
    col
      .find({}, { projection: { email: 1, source: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .skip((safePage - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ]);
  return {
    rows: docs.map((d) => ({
      id: d._id!.toHexString(),
      email: d.email,
      source: d.source ?? "—",
      subscribedAt: d.created_at
        ? new Date(d.created_at).toISOString().slice(0, 10)
        : "—",
    })),
    total,
    page: safePage,
    pageSize,
  };
}

/**
 * Every newsletter subscriber, newest first — the full unpaginated set for CSV
 * export. Staff-only (reached through the admin export route's admin gate). The
 * subscribed date is the full ISO timestamp here so the export is precise.
 */
export async function adminAllNewsletterSubscribers(): Promise<
  { email: string; source: string; subscribedAt: string }[]
> {
  const col = await getCollection<{
    email: string;
    source?: string;
    created_at?: Date;
  }>(Collections.newsletter);
  const docs = await col
    .find({}, { projection: { email: 1, source: 1, created_at: 1 } })
    .sort({ created_at: -1 })
    .toArray();
  return docs.map((d) => ({
    email: d.email,
    source: d.source ?? "",
    subscribedAt: d.created_at ? new Date(d.created_at).toISOString() : "",
  }));
}

// ── Admin finance / users / compliance aggregates ─────────
//
// Cross-family read surfaces for staff only (reached through the (admin) layout,
// gated on `is_admin`/`role`). These are aggregate or minimal-PII by design —
// no per-child learning detail, no analytics — and are cached at the metrics
// layer (`lib/metrics/server.ts`) so they stay off the request hot path.

/**
 * Parents grouped by (subscription_tier, billing_status) → counts. Feeds the
 * pure `summarizeBilling()` in `lib/metrics/finance.ts` for real MRR/ARR/mix.
 * A single `$group` — never loads parent documents into memory.
 */
export async function adminBillingBreakdown(): Promise<BillingRow[]> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  const raw = await col
    .aggregate<{ _id: { tier?: string; status?: string }; count: number }>([
      {
        $group: {
          _id: { tier: "$subscription_tier", status: "$billing_status" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const tiers = new Set<SubscriptionTier>(["diagnostic", "standard", "family"]);
  const statuses = new Set<BillingStatus>([
    "trialing",
    "active",
    "past_due",
    "canceled",
    "paused",
  ]);

  const rows: BillingRow[] = [];
  for (const r of raw) {
    const tier = r._id.tier as SubscriptionTier;
    const status = r._id.status as BillingStatus;
    // Legacy/undefined rows: default a missing tier to the free tier and a
    // missing status to trialing so counts never silently vanish, but only
    // emit rows the pure layer recognises (it also guards, belt-and-braces).
    const safeTier = tiers.has(tier) ? tier : "diagnostic";
    const safeStatus = statuses.has(status) ? status : "trialing";
    rows.push({ tier: safeTier, status: safeStatus, count: r.count });
  }
  return rows;
}

export interface AdminParentRow {
  id: string;
  name: string;
  email: string;
  tier: SubscriptionTier;
  status: BillingStatus;
  joinedAt: string; // ISO date (yyyy-mm-dd)
  childCount: number;
}

/**
 * Real parent accounts for the admin Users table, newest first, with a per-
 * parent child COUNT (never child names/details on this cross-family surface).
 * Two aggregate reads: a children `$group` for counts, then a bounded parents
 * page — no N+1.
 */
export async function adminListParents(limit = 100): Promise<AdminParentRow[]> {
  const childrenCol = await getCollection<ChildDoc>(Collections.children);
  const counts = await childrenCol
    .aggregate<{ _id: ObjectId; count: number }>([
      { $group: { _id: "$parent_id", count: { $sum: 1 } } },
    ])
    .toArray();
  const childCountByParent = new Map<string, number>();
  for (const c of counts) {
    if (c._id) childCountByParent.set(c._id.toHexString(), c.count);
  }

  const parentsCol = await getCollection<ParentDoc>(Collections.parents);
  const parents = await parentsCol
    .find(
      {},
      {
        projection: {
          full_name: 1,
          email: 1,
          subscription_tier: 1,
          billing_status: 1,
          created_at: 1,
        },
      },
    )
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();

  return parents.map((p) => {
    const id = p._id!.toHexString();
    return {
      id,
      name: p.full_name ?? "—",
      email: p.email,
      tier: (p.subscription_tier ?? "diagnostic") as SubscriptionTier,
      status: (p.billing_status ?? "trialing") as BillingStatus,
      joinedAt: p.created_at
        ? new Date(p.created_at).toISOString().slice(0, 10)
        : "—",
      childCount: childCountByParent.get(id) ?? 0,
    };
  });
}

export interface AdminDossierRow {
  id: string;
  childName: string;
  period: string;
  generatedAt: string; // ISO date
  hashShort: string;
  hasHash: boolean;
}

/**
 * Real compliance dossiers, newest first, for the admin Compliance page. Shows
 * the child's first name only (staff compliance ops must identify the child)
 * plus the reporting period and secure-hash fingerprint — the fields a dossier
 * actually carries. No fabricated LA/access-count data.
 */
export async function adminListDossiers(limit = 20): Promise<AdminDossierRow[]> {
  const col = await getCollection<DossierDoc>(Collections.dossiers);
  const dossiers = await col
    .find({})
    .sort({ generated_at: -1 })
    .limit(limit)
    .toArray();

  const childIds = [...new Set(dossiers.map((d) => d.child_id?.toHexString()).filter(Boolean))];
  const firstNameById = new Map<string, string>();
  if (childIds.length > 0) {
    const childrenCol = await getCollection<ChildDoc>(Collections.children);
    const kids = await childrenCol
      .find(
        { _id: { $in: childIds.map((id) => new ObjectId(id!)) } },
        { projection: { full_name: 1 } },
      )
      .toArray();
    for (const k of kids) {
      firstNameById.set(k._id!.toHexString(), (k.full_name ?? "").split(" ")[0] || "Child");
    }
  }

  return dossiers.map((d) => {
    const hash = d.secure_hash ?? "";
    return {
      id: d._id!.toHexString(),
      childName: firstNameById.get(d.child_id?.toHexString() ?? "") ?? "Child",
      period: d.reporting_period ?? "—",
      generatedAt: d.generated_at
        ? new Date(d.generated_at).toISOString().slice(0, 10)
        : "—",
      hashShort: hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : "—",
      hasHash: hash.length > 0,
    };
  });
}

// ── Staff roles + audit trail (operations) ────────────────

/** The effective staff role for an account (admin/support), or null. */
export async function staffRole(parentId: string): Promise<StaffRole | null> {
  const parent = await findParentById(parentId);
  if (!parent) return null;
  return resolveRole({ role: parent.role, is_admin: parent.is_admin });
}

/**
 * Append one row to the staff audit trail. Best-effort and append-only — there
 * are deliberately NO update/delete functions for this collection. Never throws
 * (an audit-write failure must not block the staff action it records, but is
 * logged for investigation).
 */
export async function recordStaffAction(input: {
  staffId: string;
  staffEmail: string;
  action: string;
  targetCollection?: string | null;
  targetId?: string | null;
  reason?: string | null;
  before?: string | null;
  after?: string | null;
  ip?: string | null;
}): Promise<void> {
  try {
    const oid = toObjectId(input.staffId);
    if (!oid) return;
    const col = await getCollection<StaffAuditLogDoc>(Collections.staffAuditLog);
    await col.insertOne({
      staff_id: oid,
      staff_email: input.staffEmail,
      action: input.action,
      target_collection: input.targetCollection ?? null,
      target_id: input.targetId ?? null,
      reason: input.reason ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      ip: input.ip ?? null,
      created_at: new Date(),
    } as StaffAuditLogDoc);
  } catch (err) {
    console.error("[staff audit] write failed (non-fatal):", err);
  }
}

export interface StaffAuditEntry {
  id: string;
  staffEmail: string;
  action: string;
  targetCollection: string | null;
  targetId: string | null;
  reason: string | null;
  before: string | null;
  after: string | null;
  createdAt: Date;
}

/** Read the audit trail with optional filters (staff email / action / since). */
export async function listStaffAudit(
  filters: { staffEmail?: string; action?: string; since?: Date } = {},
  limit = 200,
): Promise<StaffAuditEntry[]> {
  const col = await getCollection<StaffAuditLogDoc>(Collections.staffAuditLog);
  const query: Record<string, unknown> = {};
  if (filters.staffEmail) query.staff_email = filters.staffEmail;
  if (filters.action) query.action = filters.action;
  if (filters.since) query.created_at = { $gte: filters.since };
  const rows = await col
    .find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return rows.map((r) => ({
    id: r._id!.toHexString(),
    staffEmail: r.staff_email,
    action: r.action,
    targetCollection: r.target_collection ?? null,
    targetId: r.target_id ?? null,
    reason: r.reason ?? null,
    before: r.before ?? null,
    after: r.after ?? null,
    createdAt: r.created_at,
  }));
}

/** Distinct staff emails + actions seen in the trail (for filter dropdowns). */
export async function staffAuditFacets(): Promise<{
  staff: string[];
  actions: string[];
}> {
  const col = await getCollection<StaffAuditLogDoc>(Collections.staffAuditLog);
  const [staff, actions] = await Promise.all([
    col.distinct("staff_email"),
    col.distinct("action"),
  ]);
  return {
    staff: (staff as string[]).sort(),
    actions: (actions as string[]).sort(),
  };
}

// ── Escalation operations (SLA workflow) ──────────────────

/** Full escalation queue for staff, newest first, with child names. */
export interface AdminEscalation {
  id: string;
  childName: string;
  severity: EscalationDoc["severity"];
  status: EscalationDoc["status"];
  trigger: string;
  createdAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  staffNote: string | null;
}

export async function adminEscalationQueue(limit = 100): Promise<AdminEscalation[]> {
  const escCol = await getCollection<EscalationDoc>(Collections.escalations);
  const escalations = await escCol
    .find({})
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  if (escalations.length === 0) return [];

  const childCol = await getCollection<ChildDoc>(Collections.children);
  const childIds = Array.from(new Set(escalations.map((e) => e.child_id.toHexString()))).map(
    (id) => new ObjectId(id),
  );
  const children = await childCol.find({ _id: { $in: childIds } }).toArray();
  const nameById = new Map(children.map((c) => [c._id!.toHexString(), c.full_name]));

  return escalations.map((e) => ({
    id: e._id!.toHexString(),
    childName: nameById.get(e.child_id.toHexString()) ?? "a child",
    severity: e.severity,
    status: e.status,
    trigger: e.trigger,
    createdAt: e.created_at,
    acknowledgedAt: e.acknowledged_at ?? null,
    resolvedAt: e.resolved_at ?? null,
    staffNote: e.staff_note ?? null,
  }));
}

/**
 * Acknowledge or resolve an escalation (staff action). Records the transition
 * to the audit trail. `note` is internal-only. Returns false if the id is bad.
 */
export async function updateEscalationStatus(input: {
  staffId: string;
  staffEmail: string;
  escalationId: string;
  status: "acknowledged" | "resolved";
  note?: string;
}): Promise<boolean> {
  const oid = toObjectId(input.escalationId);
  if (!oid) return false;
  const col = await getCollection<EscalationDoc>(Collections.escalations);
  const set: Partial<EscalationDoc> = { status: input.status };
  if (input.status === "acknowledged") set.acknowledged_at = new Date();
  if (input.status === "resolved") set.resolved_at = new Date();
  if (typeof input.note === "string") set.staff_note = input.note;
  const res = await col.updateOne({ _id: oid }, { $set: set });
  if (res.matchedCount === 0) return false;
  await recordStaffAction({
    staffId: input.staffId,
    staffEmail: input.staffEmail,
    action: `escalation.${input.status}`,
    targetCollection: Collections.escalations,
    targetId: input.escalationId,
  });
  return true;
}

export interface EscalationStats {
  open: number;
  /** Median minutes from created→acknowledged for escalations this week. */
  medianAckMinutes: number | null;
}

/** Queue stats: open count + median time-to-acknowledge this week. */
export async function escalationStats(): Promise<EscalationStats> {
  const col = await getCollection<EscalationDoc>(Collections.escalations);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [open, acked] = await Promise.all([
    col.countDocuments({ status: "open" }),
    col
      .find({ acknowledged_at: { $gte: weekAgo } })
      .project<{ created_at: Date; acknowledged_at: Date }>({
        created_at: 1,
        acknowledged_at: 1,
      })
      .toArray(),
  ]);

  const mins = acked
    .filter((a) => a.acknowledged_at)
    .map(
      (a) =>
        (new Date(a.acknowledged_at).getTime() - new Date(a.created_at).getTime()) /
        60000,
    )
    .filter((m) => m >= 0)
    .sort((x, y) => x - y);

  let medianAckMinutes: number | null = null;
  if (mins.length > 0) {
    const mid = Math.floor(mins.length / 2);
    medianAckMinutes = Math.round(
      mins.length % 2 ? mins[mid] : (mins[mid - 1] + mins[mid]) / 2,
    );
  }
  return { open, medianAckMinutes };
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

/** Withdraw all cached AI visuals for a question; flagged images are not served. */
export async function flagQuestionVisuals(
  questionId: string,
  reason = "reported",
): Promise<number> {
  const col = await getCollection<MediaDoc>(Collections.media);
  const result = await col.updateMany(
    { use_case: "question_visual", "meta.question_id": questionId },
    {
      $set: {
        is_public: false,
        "meta.flagged": "true",
        "meta.flag_reason": reason.slice(0, 80),
        "meta.flagged_at": new Date().toISOString(),
      },
    },
  );
  return result.modifiedCount;
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
/**
 * Calendar Y/M/D and weekday for an instant in Europe/London. Day/week math is
 * pinned to London (not the Vercel server's UTC) so a UK child at 23:30 BST is
 * bucketed into the correct local day and the weekly plan rolls over at local
 * midnight, not 01:00 BST (audit MEDIUM #2). Uses Intl with an explicit
 * timeZone, so it is correct through BST/GMT transitions.
 */
export function londonParts(now: Date = new Date()): {
  year: number;
  month: number; // 1–12
  day: number;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const WD: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WD[parts.weekday as string] ?? 0,
  };
}

/**
 * The instant of "today at 00:00 in Europe/London", as a Date. Used for
 * day-boundary queries (e.g. today's check-in) so a late-evening BST session
 * isn't bucketed into the wrong UTC day (audit MEDIUM #2).
 */
export function londonDayStart(now: Date = new Date()): Date {
  const { year, month, day } = londonParts(now);
  // London midnight in UTC terms: find the offset by formatting the same wall
  // time. Construct from the London Y/M/D and let toLocaleString resolve the
  // zone offset for that date (handles BST/GMT).
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  // Determine London's offset at that date by comparing wall clock vs UTC.
  const asLondon = new Date(
    utcGuess.toLocaleString("en-US", { timeZone: "Europe/London" }),
  );
  const asUtc = new Date(utcGuess.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = asUtc.getTime() - asLondon.getTime();
  return new Date(utcGuess.getTime() + offsetMs);
}

export function currentWeekStart(now: Date = new Date()): string {
  const { year, month, day, weekday } = londonParts(now);
  // Subtract `weekday` days from the London calendar date to reach Monday. Use a
  // UTC anchor purely for the date arithmetic, then format the resulting Y/M/D.
  const anchor = new Date(Date.UTC(year, month - 1, day));
  anchor.setUTCDate(anchor.getUTCDate() - weekday);
  const y = anchor.getUTCFullYear();
  const m = String(anchor.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(anchor.getUTCDate()).padStart(2, "0");
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
/** Warm, in-band phrasing for the plan reason — never frames a child as "behind". */
const STAGE_PHRASE: Record<KeyStage, string> = {
  2: "at primary level",
  3: "at lower-secondary level",
  4: "on the GCSE path",
};

function scheduleItemReason(input: {
  subject: Subject;
  topicTitle: string;
  topicState: CompetenceDoc["state"] | undefined;
  predictedGrade: string | null;
  keyStage: KeyStage;
}): string {
  const subject = SUBJECT_DISPLAY[input.subject];
  const stage = STAGE_PHRASE[input.keyStage];
  if (input.topicState === "training") {
    return `${input.topicTitle} is already in training — this session continues it toward mastery.`;
  }
  // Only reference a GCSE predicted grade when the child is actually at GCSE.
  if (input.predictedGrade && input.keyStage === 4) {
    return `The diagnostic predicted grade ${input.predictedGrade} in ${subject}; ${input.topicTitle} is the next topic ${stage}.`;
  }
  return `${input.topicTitle} is the next ${subject} topic ${stage} — it builds the foundations later topics rely on.`;
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

  const items = await buildScheduleItems(childId);
  const doc: WeeklyScheduleDoc = {
    child_id: childId,
    week_start: weekStart,
    items,
    approved_by_parent: false,
    generated_at: new Date(),
  };
  try {
    const res = await col.insertOne(doc as WeeklyScheduleDoc);
    return { schedule: { ...doc, _id: res.insertedId }, created: true };
  } catch (err) {
    // Concurrent first access (double-tap / prefetch + navigate): the unique
    // (child_id, week_start) index rejects the losing insert with E11000.
    // Return the row the winner created instead of throwing a 500 — and report
    // created:false so the one-time plan email is sent only by the winner.
    if (isDuplicateKeyError(err)) {
      const winner = await col.findOne({ child_id: childId, week_start: weekStart });
      if (winner) return { schedule: winner, created: false };
    }
    throw err;
  }
}

/**
 * Build a fresh week of plan items from the child's curriculum gaps: the next
 * not-yet-certified topic per subject, one per weekday (Mon=Maths, Tue=English,
 * Wed=Science, Thu=Maths, Fri=English), with a data-grounded reason per item.
 * Pure of any persistence so both initial generation and regeneration share it.
 */
async function buildScheduleItems(childId: ObjectId): Promise<ScheduleItemDoc[]> {
  // The child's age-expected band floor — the plan never selects below it.
  const childCol = await getCollection<ChildDoc>(Collections.children);
  const child = await childCol.findOne({ _id: childId });
  const floor: KeyStage = child ? childFloorBand(child.date_of_birth) : 4;

  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const competence = await compCol.find({ child_id: childId }).toArray();
  const certifiedTags = new Set(
    competence.filter((c) => c.state === "certified").map((c) => c.topic_tag),
  );
  const stateByTag = new Map(competence.map((c) => [c.topic_tag, c.state]));

  const standings = await latestEvaluationsBySubject(childId);
  const gradeBySubject = new Map(standings.map((s) => [s.subject, s.grade]));

  const subjects: Subject[] = ["mathematics", "english", "science"];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const allTopics = await topicsCol.find({}).sort({ order: 1 }).toArray();

  // Per subject, work in the child's CURRENT band and pick the next uncertified
  // topic there. A KS2 child gets KS2 topics; the band advances only once the
  // current band is fully certified (cross-band progression).
  const nextBySubject: Record<Subject, CurriculumTopicDoc | null> = {
    mathematics: null,
    english: null,
    science: null,
  };
  const bandBySubject: Record<Subject, KeyStage> = {
    mathematics: floor,
    english: floor,
    science: floor,
  };
  for (const subj of subjects) {
    const band = bandFromData(floor, subj, allTopics, certifiedTags);
    bandBySubject[subj] = band;
    const inBand = allTopics.filter(
      (t) => t.subject === subj && (t.key_stage ?? 4) === band,
    );
    nextBySubject[subj] =
      inBand.find((t) => !certifiedTags.has(t.topic_tag)) ?? inBand[0] ?? null;
  }

  const items: ScheduleItemDoc[] = [];
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
          keyStage: bandBySubject[subject],
        }),
      });
    }
  }
  return items;
}

const PARENT_EDIT_REASON = "Chosen by you.";

/** The subject's uncertified topics (in order) — the valid swap targets. */
export async function swappableTopicsForSubject(
  childId: ObjectId,
  subject: Subject,
): Promise<{ topicTag: string; title: string }[]> {
  const compCol = await getCollection<CompetenceDoc>(Collections.competence);
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const certified = new Set(
    (await compCol.find({ child_id: childId, state: "certified" }).toArray()).map(
      (c) => c.topic_tag,
    ),
  );
  const topics = await topicsCol.find({ subject }).sort({ order: 1 }).toArray();
  return topics
    .filter((t) => !certified.has(t.topic_tag))
    .map((t) => ({ topicTag: t.topic_tag, title: t.title }));
}

/**
 * Replace the topic of the schedule item at `itemIndex` with `topicTag` (must be
 * a valid uncertified topic in that item's subject). Marks the item as a parent
 * choice and counts the edit as approval. Ownership enforced.
 */
export async function swapScheduleItemTopic(
  parentId: string,
  childId: ObjectId,
  itemIndex: number,
  topicTag: string,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  const schedule = await col.findOne({
    child_id: childId,
    week_start: currentWeekStart(),
  });
  if (!schedule || !schedule.items[itemIndex]) return false;

  const item = schedule.items[itemIndex];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const topic = await topicsCol.findOne({ topic_tag: topicTag, subject: item.subject });
  if (!topic) return false; // must be a real topic in the SAME subject

  const items = [...schedule.items];
  items[itemIndex] = {
    ...item,
    topic_tag: topic.topic_tag,
    topic_title: topic.title,
    reason: PARENT_EDIT_REASON,
  };
  await col.updateOne(
    { _id: schedule._id },
    { $set: { items, approved_by_parent: true } },
  );
  return true;
}

/**
 * Move the item at `itemIndex` to `newDay` (0–6). Counts as a parent approval.
 * Ownership enforced.
 */
export async function moveScheduleItemDay(
  parentId: string,
  childId: ObjectId,
  itemIndex: number,
  newDay: number,
): Promise<boolean> {
  if (newDay < 0 || newDay > 6) return false;
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  const schedule = await col.findOne({
    child_id: childId,
    week_start: currentWeekStart(),
  });
  if (!schedule || !schedule.items[itemIndex]) return false;

  const items = [...schedule.items];
  items[itemIndex] = { ...items[itemIndex], day: newDay };
  await col.updateOne(
    { _id: schedule._id },
    { $set: { items, approved_by_parent: true } },
  );
  return true;
}

/** Remove all items on a weekday ("we're away that day"). Counts as approval. */
export async function clearScheduleDay(
  parentId: string,
  childId: ObjectId,
  day: number,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  const schedule = await col.findOne({
    child_id: childId,
    week_start: currentWeekStart(),
  });
  if (!schedule) return false;
  const items = schedule.items.filter((it) => it.day !== day);
  await col.updateOne(
    { _id: schedule._id },
    { $set: { items, approved_by_parent: true } },
  );
  return true;
}

/** Regenerate the whole week from current progress (re-runs the generator). */
export async function regenerateWeeklySchedule(
  parentId: string,
  childId: ObjectId,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<WeeklyScheduleDoc>(Collections.schedules);
  const items = await buildScheduleItems(childId);
  await col.updateOne(
    { child_id: childId, week_start: currentWeekStart() },
    {
      $set: {
        items,
        approved_by_parent: false,
        generated_at: new Date(),
      },
      $setOnInsert: { child_id: childId, week_start: currentWeekStart() },
    },
    { upsert: true },
  );
  return true;
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

/**
 * Getting-started checklist state for the active child, derived entirely from
 * real data (no stored checklist flags that could drift). Each boolean answers
 * one onboarding step:
 *  - hasChild:            the parent has at least one child (caller-supplied)
 *  - hasEvaluation:       a diagnostic/mock result exists for this child
 *  - hasApprovedSchedule: any weekly plan was ever approved for this child
 *  - hasLesson:           at least one lesson has been logged for this child
 * Ownership is enforced; a non-owned child returns all-false.
 */
export interface OnboardingChecklist {
  hasEvaluation: boolean;
  hasApprovedSchedule: boolean;
  hasLesson: boolean;
}

export async function onboardingChecklist(
  parentId: string,
  childId: ObjectId,
): Promise<OnboardingChecklist> {
  const empty: OnboardingChecklist = {
    hasEvaluation: false,
    hasApprovedSchedule: false,
    hasLesson: false,
  };
  if (!(await assertOwnsChild(parentId, childId))) return empty;

  const [evals, schedules, logs] = await Promise.all([
    getCollection<EvaluationDoc>(Collections.evaluations),
    getCollection<WeeklyScheduleDoc>(Collections.schedules),
    getCollection<LessonLogDoc>(Collections.lessonLogs),
  ]);

  const [evalCount, approvedCount, lessonCount] = await Promise.all([
    evals.countDocuments({ child_id: childId }, { limit: 1 }),
    schedules.countDocuments(
      { child_id: childId, approved_by_parent: true },
      { limit: 1 },
    ),
    logs.countDocuments({ child_id: childId }, { limit: 1 }),
  ]);

  return {
    hasEvaluation: evalCount > 0,
    hasApprovedSchedule: approvedCount > 0,
    hasLesson: lessonCount > 0,
  };
}

// ── Tutor bookings (Stage 5) ─────────────────────────────
const TIER_TUTOR_QUOTA: Record<ParentDoc["subscription_tier"], number> = {
  diagnostic: 0,
  standard: 1, // Edway Complete: 1/mo
  family: 3, // Edway Partner: 3/mo
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
    source: "parent",
    note: input.note,
    requested_slot: input.requestedSlot,
    status: "requested",
    created_at: new Date(),
  } as TutorBookingDoc);
  return { ok: true };
}

export async function createRemediationTutorHandoff(
  parentId: string,
  childId: ObjectId,
  input: {
    subject: Subject | null;
    topicTag: string;
    topicTitle: string;
    note: string;
  },
): Promise<{ ok: boolean; created: boolean; reason?: string }> {
  if (!(await assertOwnsChild(parentId, childId))) {
    return { ok: false, created: false, reason: "Child not found." };
  }
  const oid = toObjectId(parentId);
  if (!oid) return { ok: false, created: false, reason: "Invalid parent." };

  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  // Idempotency: one handoff per child+topic per active struggle. The decision
  // is pure (`shouldQueueHandoff`) so it's unit-tested apart from the DB.
  const existing = await col
    .find({
      parent_id: oid,
      child_id: childId,
      topic_tag: input.topicTag,
      source: "remediation",
    })
    .toArray();
  if (!shouldQueueHandoff(existing.map((e) => e.status))) {
    return { ok: true, created: false };
  }

  await col.insertOne({
    parent_id: oid,
    child_id: childId,
    subject: input.subject,
    topic_tag: input.topicTag,
    topic_title: input.topicTitle,
    source: "remediation",
    note: input.note,
    requested_slot: "Queued by Edway after a tricky mastery check",
    status: "requested",
    created_at: new Date(),
  } as TutorBookingDoc);
  return { ok: true, created: true };
}

/**
 * Set a topic aside ("resting") for the five-attempt human handoff. Marks the
 * child's competence row as tutor-paused WITHOUT demoting its state — the topic
 * is never "failed", just paused until a tutor helps. Idempotent (re-pausing
 * just refreshes the timestamp). Ownership enforced.
 */
export async function pauseTopicForTutor(
  parentId: string,
  childId: ObjectId,
  topicTag: string,
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  await col.updateOne(
    { child_id: childId, topic_tag: topicTag },
    {
      $set: { tutor_paused_at: new Date(), updated_at: new Date() },
      $setOnInsert: { state: "training", certified_at: null },
    },
    { upsert: true },
  );
  return true;
}

/** Topic tags currently paused for a tutor handoff (child read; set aside). */
export async function tutorPausedTags(childId: ObjectId): Promise<Set<string>> {
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  const rows = await col
    .find({ child_id: childId, tutor_paused_at: { $ne: null } })
    .toArray();
  return new Set(rows.filter((r) => r.tutor_paused_at).map((r) => r.topic_tag));
}

export interface TutorHandoffState {
  /** True when this topic is resting, awaiting a tutor. */
  paused: boolean;
  /** The tutor's note from a logged session, surfaced to the next explanation. */
  note: string | null;
}

/** This child's handoff state for one topic (paused? + any tutor note). */
export async function getTutorHandoffState(
  childId: ObjectId,
  topicTag: string,
): Promise<TutorHandoffState> {
  const col = await getCollection<CompetenceDoc>(Collections.competence);
  const row = await col.findOne({ child_id: childId, topic_tag: topicTag });
  return { paused: !!row?.tutor_paused_at, note: row?.tutor_note ?? null };
}

export async function listTutorBookings(
  parentId: string,
): Promise<TutorBookingDoc[]> {
  const oid = toObjectId(parentId);
  if (!oid) return [];
  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  return col.find({ parent_id: oid }).sort({ created_at: -1 }).limit(20).toArray();
}

export interface StaffTutorRequest {
  booking: TutorBookingDoc;
  childName: string;
}

export async function listTutorBookingsAsStaff(
  limit = 20,
): Promise<StaffTutorRequest[]> {
  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  const bookings = await col
    .find({ status: { $in: ["requested", "scheduled"] } })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  if (bookings.length === 0) return [];

  const childIds = bookings.map((b) => b.child_id);
  const children = await (
    await getCollection<ChildDoc>(Collections.children)
  )
    .find({ _id: { $in: childIds } })
    .toArray();
  const nameById = new Map(children.map((c) => [c._id!.toHexString(), c.full_name]));
  return bookings.map((booking) => ({
    booking,
    childName: nameById.get(booking.child_id.toHexString()) ?? "Child",
  }));
}

/**
 * Staff logs a (deferred, manually-run) tutor session against a queued request:
 * marks the booking completed and — for a topic-scoped remediation handoff —
 * writes the tutor's note onto the child's competence record and LIFTS the
 * syllabus pause, so the next lesson surfaces the tip and the topic returns to
 * rotation. Wires the human → next-explanation data path; the live session is
 * deferred. Audited in the append-only staff trail. Staff-only (no parentId).
 */
export async function logTutorSessionAsStaff(input: {
  staffId: string;
  staffEmail: string;
  bookingId: string;
  note: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const bookingOid = toObjectId(input.bookingId);
  if (!bookingOid) return { ok: false, reason: "Invalid booking." };
  const note = input.note.trim().slice(0, 1000);

  const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
  const booking = await col.findOne({ _id: bookingOid });
  if (!booking) return { ok: false, reason: "Booking not found." };

  await col.updateOne({ _id: bookingOid }, { $set: { status: "completed" } });

  // Topic-scoped handoff: feed the note back to the child's record and lift the
  // pause so the topic resumes (never demoting its competence state).
  if (booking.topic_tag && note) {
    const comp = await getCollection<CompetenceDoc>(Collections.competence);
    await comp.updateOne(
      { child_id: booking.child_id, topic_tag: booking.topic_tag },
      {
        $set: {
          tutor_note: note,
          tutor_session_at: new Date(),
          tutor_paused_at: null,
          updated_at: new Date(),
        },
      },
    );
  }

  await recordStaffAction({
    staffId: input.staffId,
    staffEmail: input.staffEmail,
    action: "tutor.session_logged",
    targetCollection: Collections.tutorBookings,
    targetId: input.bookingId,
  });
  return { ok: true };
}

// ── Parent ↔ staff messaging ─────────────────────────────
//
// ISOLATION CONTRACT (cross-family leakage is the top risk here):
//   • Every PARENT read/write filters on parent_id — a parent can only ever
//     touch threads they own. A thread is "owned" when its booking/escalation
//     belongs to the parent (verified before the first post).
//   • STAFF functions are suffixed `AsStaff`, take NO parentId, and are only
//     called from (admin) routes behind the existing admin gate.

/** Does this parent own the booking/escalation a thread hangs off? */
async function parentOwnsThread(
  parentId: string,
  threadType: MessageDoc["thread_type"],
  threadId: string,
): Promise<boolean> {
  const parentOid = toObjectId(parentId);
  const threadOid = toObjectId(threadId);
  if (!parentOid || !threadOid) return false;

  if (threadType === "booking") {
    const col = await getCollection<TutorBookingDoc>(Collections.tutorBookings);
    const b = await col.findOne({ _id: threadOid, parent_id: parentOid });
    return !!b;
  }
  // escalation: the escalation belongs to one of the parent's children.
  const escCol = await getCollection<EscalationDoc>(Collections.escalations);
  const esc = await escCol.findOne({ _id: threadOid });
  if (!esc) return false;
  return assertOwnsChild(parentId, esc.child_id);
}

/** Messages in a thread the PARENT owns, oldest first. Returns [] if not owned. */
export async function listThreadMessagesForParent(
  parentId: string,
  threadType: MessageDoc["thread_type"],
  threadId: string,
): Promise<MessageDoc[]> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return [];
  if (!(await parentOwnsThread(parentId, threadType, threadId))) return [];
  const col = await getCollection<MessageDoc>(Collections.messages);
  return col
    .find({ parent_id: parentOid, thread_type: threadType, thread_id: threadId })
    .sort({ created_at: 1 })
    .toArray();
}

/** Parent posts to a thread they own. Returns false if not owned. */
export async function postMessageAsParent(
  parentId: string,
  threadType: MessageDoc["thread_type"],
  threadId: string,
  childId: ObjectId,
  body: string,
): Promise<boolean> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return false;
  if (!(await parentOwnsThread(parentId, threadType, threadId))) return false;
  // The child must also belong to the parent (defence in depth).
  if (!(await assertOwnsChild(parentId, childId))) return false;

  const col = await getCollection<MessageDoc>(Collections.messages);
  await col.insertOne({
    thread_type: threadType,
    thread_id: threadId,
    parent_id: parentOid,
    child_id: childId,
    sender: "parent",
    body,
    created_at: new Date(),
    read_at: null,
  } as MessageDoc);
  return true;
}

/** Mark all staff messages in a parent-owned thread as read by the parent. */
export async function markThreadReadByParent(
  parentId: string,
  threadType: MessageDoc["thread_type"],
  threadId: string,
): Promise<void> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return;
  if (!(await parentOwnsThread(parentId, threadType, threadId))) return;
  const col = await getCollection<MessageDoc>(Collections.messages);
  await col.updateMany(
    {
      parent_id: parentOid,
      thread_type: threadType,
      thread_id: threadId,
      sender: "staff",
      read_at: null,
    },
    { $set: { read_at: new Date() } },
  );
}

/** Count unread staff messages across all of a parent's threads (nav badge). */
export async function unreadMessageCountForParent(parentId: string): Promise<number> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return 0;
  const col = await getCollection<MessageDoc>(Collections.messages);
  return col.countDocuments({
    parent_id: parentOid,
    sender: "staff",
    read_at: null,
  });
}

// ── Staff side (admin-gated; no parentId filter by design) ──

/** All messages in a thread, oldest first — STAFF view. */
export async function listThreadMessagesAsStaff(
  threadType: MessageDoc["thread_type"],
  threadId: string,
): Promise<MessageDoc[]> {
  const col = await getCollection<MessageDoc>(Collections.messages);
  return col
    .find({ thread_type: threadType, thread_id: threadId })
    .sort({ created_at: 1 })
    .toArray();
}

/**
 * Staff posts to a thread. Looks up the owning parent_id/child_id from an
 * existing message OR the underlying booking/escalation so the new row stays
 * correctly attributed. Returns the parent_id for notification, or null.
 */
export async function postMessageAsStaff(
  threadType: MessageDoc["thread_type"],
  threadId: string,
  body: string,
): Promise<{ parentId: ObjectId; childId: ObjectId } | null> {
  const threadOid = toObjectId(threadId);
  if (!threadOid) return null;

  let parentId: ObjectId | null = null;
  let childId: ObjectId | null = null;

  if (threadType === "booking") {
    const b = await (
      await getCollection<TutorBookingDoc>(Collections.tutorBookings)
    ).findOne({ _id: threadOid });
    if (b) {
      parentId = b.parent_id;
      childId = b.child_id;
    }
  } else {
    const esc = await (
      await getCollection<EscalationDoc>(Collections.escalations)
    ).findOne({ _id: threadOid });
    if (esc) {
      childId = esc.child_id;
      const childCol = await getCollection<ChildDoc>(Collections.children);
      const child = await childCol.findOne({ _id: esc.child_id });
      if (child) parentId = child.parent_id;
    }
  }

  if (!parentId || !childId) return null;

  const col = await getCollection<MessageDoc>(Collections.messages);
  await col.insertOne({
    thread_type: threadType,
    thread_id: threadId,
    parent_id: parentId,
    child_id: childId,
    sender: "staff",
    body,
    created_at: new Date(),
    read_at: null,
  } as MessageDoc);
  return { parentId, childId };
}

// ── Weekly parent progress digest ────────────────────────
export interface ChildWeekSummary {
  childName: string;
  lessonsCompleted: number;
  /** Human topic titles certified this week. */
  topicsCertified: string[];
  /** Escalations raised this week (count only — details stay in the dashboard). */
  escalations: number;
  /** Qualitative signal (Wave 7, Phase 5): topics attempted but not yet secure. */
  struggledTopics: string[];
  /** Per-concept standing tallies across the child's topics. */
  standings: { strong: number; growing: number; starting: number };
  /** The single topic worth revisiting next, or null. */
  recommendedFocus: string | null;
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
 * Parents eligible for event-driven milestone pushes (mastery / inactivity):
 * verified email, not opted out, not the CI smoke account. The inactivity cron
 * iterates these; the per-send path re-checks opt-out defensively.
 */
export async function listEventNotificationRecipients(): Promise<ParentDoc[]> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  return col
    .find({
      email_verified: { $ne: false },
      event_notifications_opt_out: { $ne: true },
      is_smoke_account: { $ne: true },
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

  const [lessonGroups, certRows, escGroups, allComps, weekLogs] =
    await Promise.all([
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
      // Full competence picture (all states) → per-concept standings.
      compCol.find({ child_id: { $in: childIds } }).toArray(),
      // This week's completed lessons → what was attempted but not yet secure.
      logsCol
        .find({
          child_id: { $in: childIds },
          status: "completed",
          timestamp_end: { $gte: since },
        })
        .project<{ child_id: ObjectId; topic_tag: string; mastery_score: number | null }>(
          { child_id: 1, topic_tag: 1, mastery_score: 1 },
        )
        .toArray(),
    ]);

  // Resolve every involved topic tag to a human title (global reference content).
  const tags = [
    ...new Set([
      ...certRows.map((r) => r.topic_tag),
      ...allComps.map((c) => c.topic_tag),
      ...weekLogs.map((l) => l.topic_tag),
    ]),
  ];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const topics = tags.length
    ? await topicsCol.find({ topic_tag: { $in: tags } }).toArray()
    : [];
  const titleByTag = new Map(topics.map((t) => [t.topic_tag, t.title]));
  const title = (tag: string) => titleByTag.get(tag) ?? tag;

  const lessonsByChild = new Map(
    lessonGroups.map((g) => [g._id.toHexString(), g.count]),
  );
  const escalationsByChild = new Map(
    escGroups.map((g) => [g._id.toHexString(), g.count]),
  );

  return children.map((child) => {
    const id = child._id!.toHexString();
    const comps = allComps.filter((c) => c.child_id.toHexString() === id);
    const logs = weekLogs.filter((l) => l.child_id.toHexString() === id);

    // Best mastery seen this week per topic (for the standing refinement).
    const weekBestByTag = new Map<string, number>();
    for (const l of logs) {
      const m = l.mastery_score ?? 0;
      weekBestByTag.set(l.topic_tag, Math.max(weekBestByTag.get(l.topic_tag) ?? 0, m));
    }
    const certifiedTags = new Set(
      comps.filter((c) => c.state === "certified").map((c) => c.topic_tag),
    );

    // Per-concept standings across every topic the child has a row for.
    const standings = { strong: 0, growing: 0, starting: 0 };
    for (const c of comps) {
      const standing = classifyTopicStanding({
        state: c.state,
        paused: !!c.tutor_paused_at,
        weekBestMastery: weekBestByTag.get(c.topic_tag) ?? null,
      });
      if (standing) standings[standing] += 1;
    }

    // Topics attempted this week but not yet secure — worst mastery first.
    const struggled = [...weekBestByTag.entries()]
      .filter(([tag]) => !certifiedTags.has(tag))
      .sort((a, b) => a[1] - b[1]);
    // Any handoff-paused topic is a struggle worth naming even without a log.
    const pausedTags = comps
      .filter((c) => c.tutor_paused_at && !certifiedTags.has(c.topic_tag))
      .map((c) => c.topic_tag);
    const struggledTags = [
      ...new Set([...pausedTags, ...struggled.map(([tag]) => tag)]),
    ];
    const struggledTopics = struggledTags.map(title);

    return {
      childName: child.full_name,
      lessonsCompleted: lessonsByChild.get(id) ?? 0,
      topicsCertified: certRows
        .filter((r) => r.child_id.toHexString() === id)
        .map((r) => title(r.topic_tag)),
      escalations: escalationsByChild.get(id) ?? 0,
      struggledTopics,
      standings,
      recommendedFocus: struggledTopics[0] ?? null,
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

export async function setDailySummaryOptOut(
  parentId: string,
  optOut: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { daily_summary_opt_out: optOut, updated_at: new Date() } },
  );
  return true;
}

export async function setEventNotificationsOptOut(
  parentId: string,
  optOut: boolean,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { event_notifications_opt_out: optOut, updated_at: new Date() } },
  );
  return true;
}

// ── Parent milestone events (Wave 7, Phase 5) ────────────

export interface ParentEventInput {
  type: ParentEventDoc["type"];
  topicTitle?: string | null;
  subject?: Subject | null;
  attempts?: number | null;
  /** Idempotency key; the event is recorded (and notified) at most once. */
  dedupeKey: string;
}

/**
 * Record a parent milestone event idempotently. Ownership enforced. The unique
 * (parent_id, dedupe_key) index guarantees a moment is stored once; the atomic
 * upsert makes the FIRST caller the one that gets `created: true` (so exactly
 * one email/SMS is ever dispatched for it). Returns `{ created: false }` on a
 * duplicate, a bad id, or a non-owned child.
 */
export async function recordParentEvent(
  parentId: string,
  child: ChildDoc,
  input: ParentEventInput,
): Promise<{ created: boolean }> {
  const parentOid = toObjectId(parentId);
  if (!parentOid || !child._id) return { created: false };
  if (!(await assertOwnsChild(parentId, child._id))) return { created: false };

  const col = await getCollection<ParentEventDoc>(Collections.parentEvents);
  const now = new Date();
  const res = await col.updateOne(
    { parent_id: parentOid, dedupe_key: input.dedupeKey },
    {
      $setOnInsert: {
        parent_id: parentOid,
        child_id: child._id,
        child_name: child.full_name,
        type: input.type,
        topic_title: input.topicTitle ?? null,
        subject: input.subject ?? null,
        attempts: input.attempts ?? null,
        dedupe_key: input.dedupeKey,
        created_at: now,
      },
    },
    { upsert: true },
  );
  return { created: res.upsertedCount > 0 };
}

/**
 * How many completed lessons a child has logged on a topic — the honest
 * "attempts it took" figure for the mastery celebration. At least 1 for a topic
 * that has just been certified.
 */
export async function masteryAttemptCount(
  childId: ObjectId,
  topicTag: string,
): Promise<number> {
  const col = await getCollection<LessonLogDoc>(Collections.lessonLogs);
  const n = await col.countDocuments({
    child_id: childId,
    topic_tag: topicTag,
    status: "completed",
  });
  return Math.max(1, n);
}

export interface ActivityFeedItem {
  kind: "mastery" | "handoff" | "inactivity" | "lesson_completed" | "lesson_started";
  childName: string;
  /** Topic title (events) or humanised topic tag (lessons); may be null. */
  topicTitle: string | null;
  attempts: number | null;
  at: Date;
}

/**
 * Unified parent activity feed: milestone events (mastery / handoff /
 * inactivity) merged with recent lesson activity, newest first. The data-silo
 * holds by construction — parent_events is filtered by parent_id and lesson
 * logs by the parent's own child ids. Returns [] when the parent has no
 * children. Read-only.
 */
export async function listActivityFeed(
  parentId: string,
  limit = 8,
): Promise<ActivityFeedItem[]> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return [];
  const children = await listChildren(parentId);
  if (children.length === 0) return [];
  const childIds = children.map((c) => c._id!).filter(Boolean);
  const nameById = new Map(
    children.map((c) => [c._id!.toHexString(), c.full_name]),
  );

  const eventsCol = await getCollection<ParentEventDoc>(Collections.parentEvents);
  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);

  const [events, logs] = await Promise.all([
    eventsCol
      .find({ parent_id: parentOid })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray(),
    logsCol
      .find({ child_id: { $in: childIds }, status: { $in: ["completed", "in_progress"] } })
      .sort({ timestamp_start: -1 })
      .limit(limit)
      .toArray(),
  ]);

  // Resolve lesson topic tags to proper human titles (global reference content),
  // so the feed reads consistently Title-Cased rather than "fractions_intro".
  const logTags = [...new Set(logs.map((l) => l.topic_tag))];
  const topicsCol = await getCollection<CurriculumTopicDoc>(Collections.topics);
  const topicDocs = logTags.length
    ? await topicsCol.find({ topic_tag: { $in: logTags } }).toArray()
    : [];
  const titleByTag = new Map(topicDocs.map((t) => [t.topic_tag, t.title]));

  const items: ActivityFeedItem[] = [
    ...events.map((e) => ({
      kind: e.type,
      childName: e.child_name,
      topicTitle: e.topic_title ?? null,
      attempts: e.attempts ?? null,
      at: e.created_at,
    })),
    ...logs.map((l) => ({
      kind: (l.status === "completed" ? "lesson_completed" : "lesson_started") as
        | "lesson_completed"
        | "lesson_started",
      childName: nameById.get(l.child_id.toHexString()) ?? "Your child",
      topicTitle:
        titleByTag.get(l.topic_tag) ?? l.topic_tag.replace(/_/g, " "),
      attempts: null,
      at: (l.timestamp_end as Date | null) ?? l.timestamp_start,
    })),
  ];

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, limit);
}

/**
 * Children of a parent who have NOT completed a lesson today (UTC) but were
 * active in the last 14 days — the honest signal for a gentle parent
 * inactivity reminder. A child who has never started is excluded (nothing to
 * nudge back to); so is one who already learned today. Ownership holds by
 * construction (queries are scoped to this parent's own children).
 */
export async function inactivityNudgeChildren(
  parentId: string,
): Promise<ChildDoc[]> {
  const children = await listChildren(parentId);
  if (children.length === 0) return [];

  const dayStart = londonDayStart();
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const logsCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);

  const result: ChildDoc[] = [];
  for (const child of children) {
    if (!child._id) continue;
    const [doneToday, activeRecently] = await Promise.all([
      logsCol.countDocuments({
        child_id: child._id,
        status: "completed",
        timestamp_end: { $gte: dayStart },
      }),
      logsCol.countDocuments({
        child_id: child._id,
        status: "completed",
        timestamp_end: { $gte: since14 },
      }),
    ]);
    if (doneToday === 0 && activeRecently > 0) result.push(child);
  }
  return result;
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

/**
 * Set a child's personalisation choices (narration voice + child-mode accent).
 * Both optional; only provided fields are written. Ownership enforced — the
 * child must belong to the parent. Validation of allowed values happens in the
 * calling action.
 */
export async function setChildPreferences(
  parentId: string,
  childId: ObjectId,
  prefs: {
    voiceId?: string | null;
    accent?: string | null;
    narrationAutoplay?: boolean;
  },
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const set: Partial<ChildDoc> = { updated_at: new Date() };
  if (prefs.voiceId !== undefined) set.voice_id = prefs.voiceId;
  if (prefs.accent !== undefined) set.accent = prefs.accent;
  if (prefs.narrationAutoplay !== undefined)
    set.narration_autoplay = prefs.narrationAutoplay;
  const col = await getCollection<ChildDoc>(Collections.children);
  const res = await col.updateOne({ _id: childId }, { $set: set });
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
  input: {
    trigger: string;
    severity: EscalationDoc["severity"];
    matchedText: string;
    /** The specific phrase that fired (audit detail; LOW #4). */
    phrase?: string;
  },
): Promise<void> {
  const col = await getCollection<EscalationDoc>(Collections.escalations);
  await col.insertOne({
    child_id: childId,
    trigger: input.trigger,
    severity: input.severity,
    matched_text: input.matchedText.slice(0, 280),
    phrase: input.phrase,
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

export interface ParentEscalation {
  id: string;
  childId: ObjectId;
  childName: string;
  severity: EscalationDoc["severity"];
  createdAt: Date;
  /** Reassuring, parent-safe status — derived, never the raw staff workflow. */
  reassurance: string;
}

/**
 * A parent's currently-open escalations across all their children, annotated
 * with the child's name and a reassuring status line. Ownership is implicit: we
 * resolve childIds from the parent's own children, so only their escalations are
 * ever returned. Parents NEVER see staff notes or SLA timers — only whether the
 * team has started looking.
 */
export async function listOpenEscalationsForParent(
  parentId: string,
): Promise<ParentEscalation[]> {
  const kids = await listChildren(parentId);
  if (kids.length === 0) return [];
  const nameById = new Map(kids.map((k) => [k._id!.toHexString(), k.full_name]));
  // Show open + acknowledged (resolved ones drop off the parent's list).
  const escCol = await getCollection<EscalationDoc>(Collections.escalations);
  const escalations = await escCol
    .find({
      child_id: { $in: kids.map((k) => k._id!) },
      status: { $in: ["open", "acknowledged"] },
    })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
  return escalations.map((e) => ({
    id: e._id!.toHexString(),
    childId: e.child_id,
    childName: nameById.get(e.child_id.toHexString()) ?? "your child",
    severity: e.severity,
    createdAt: e.created_at,
    reassurance:
      e.status === "acknowledged"
        ? "A member of our team is looking into this."
        : "We've logged this and our team will review it shortly.",
  }));
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

/** Set (or clear with null) the parent's E.164 phone for safety SMS. */
export async function setParentPhone(
  parentId: string,
  phone: string | null,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: oid },
    { $set: { phone, updated_at: new Date() } },
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
  // The smoke account never claims a lifecycle key, so it never receives any
  // onboarding/lifecycle email (CI must not send real mail).
  const res = await col.updateOne(
    { _id: oid, lifecycle_emails_sent: { $ne: key }, is_smoke_account: { $ne: true } },
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

/**
 * Atomically claim the daily progress summary for a child on a given UTC day,
 * so it's sent at most once per child per day even if the child finishes more
 * lessons or re-opens. Returns true only if THIS call set the day-key (i.e. the
 * caller now owns the send); false if it was already sent today.
 */
export async function claimDailySummary(
  childId: ObjectId,
  dayKey: string,
): Promise<boolean> {
  const col = await getCollection<ChildDoc>(Collections.children);
  const res = await col.updateOne(
    { _id: childId, daily_summary_sent_on: { $ne: dayKey } },
    { $set: { daily_summary_sent_on: dayKey, updated_at: new Date() } },
  );
  return res.modifiedCount > 0;
}

/** Release today's daily-summary claim (roll back if the send fails). */
export async function releaseDailySummary(
  childId: ObjectId,
  dayKey: string,
): Promise<void> {
  const col = await getCollection<ChildDoc>(Collections.children);
  await col.updateOne(
    { _id: childId, daily_summary_sent_on: dayKey },
    { $unset: { daily_summary_sent_on: "" }, $set: { updated_at: new Date() } },
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

// ── Lifecycle re-engagement (win-back / upsell) ──────────

export interface ReengagementCandidate {
  parent: ParentDoc;
  /** First name of a child, for personalisation. */
  childFirstName: string;
}

/**
 * Parents eligible for a re-engagement evaluation: verified, NOT opted out of
 * marketing, not the CI smoke account, idle at least `minIdleMs`, AND already
 * ACTIVATED (≥1 child with a recorded diagnostic evaluation). Never-activated
 * accounts are the onboarding-rescue segment (welcome / diagnostic nudge), not
 * this series, so they are excluded here by construction. Bounded by `limit`,
 * oldest-idle first. The pure `decideReengagement` still re-checks every guard;
 * this query only narrows the working set. No child is queried for behaviour —
 * only "has this family ever started" (a parent-activation fact).
 */
export async function findReengagementCandidates(
  minIdleMs: number,
  limit = 500,
): Promise<ReengagementCandidate[]> {
  const parentCol = await getCollection<ParentDoc>(Collections.parents);
  const childCol = await getCollection<ChildDoc>(Collections.children);
  const evalCol = await getCollection<EvaluationDoc>(Collections.evaluations);

  const cutoff = new Date(Date.now() - minIdleMs);
  const parents = await parentCol
    .find({
      email_verified: { $ne: false },
      is_smoke_account: { $ne: true },
      marketing_emails_opt_out: { $ne: true },
      last_active: { $exists: true, $lte: cutoff },
    })
    .sort({ last_active: 1 })
    .limit(limit)
    .toArray();

  const candidates: ReengagementCandidate[] = [];
  for (const parent of parents) {
    if (!parent._id) continue;
    const children = await childCol
      .find({ parent_id: parent._id })
      .sort({ created_at: 1 })
      .toArray();
    if (children.length === 0) continue; // no child to talk about

    const childIds = children.map((c) => c._id!).filter(Boolean);
    const hasDiagnostic = await evalCol.countDocuments({
      child_id: { $in: childIds },
    });
    if (hasDiagnostic === 0) continue; // never activated — onboarding owns them

    candidates.push({
      parent,
      childFirstName: children[0].full_name.split(" ")[0] || children[0].full_name,
    });
  }
  return candidates;
}

/**
 * Claim one re-engagement stage for a parent so it is sent at most once per idle
 * cycle, even under overlapping cron runs — the same claim-first pattern as
 * `claimLifecycleEmail`. `$addToSet` is idempotent, so a losing racer sees
 * modifiedCount 0 and stands down. The smoke account never claims (never mailed).
 * `claimKey` embeds the anchoring `last_active`, so a new cycle resets naturally.
 */
export async function claimReengagementStage(
  parentId: string,
  claimKey: string,
): Promise<boolean> {
  const oid = toObjectId(parentId);
  if (!oid) return false;
  const col = await getCollection<ParentDoc>(Collections.parents);
  const res = await col.updateOne(
    {
      _id: oid,
      reengagement_sent: { $ne: claimKey },
      is_smoke_account: { $ne: true },
    },
    {
      $addToSet: { reengagement_sent: claimKey },
      $set: { reengagement_last_sent_at: new Date() },
    },
  );
  return res.modifiedCount > 0;
}

/** Roll back a re-engagement claim if the send fails, so a later run retries. */
export async function releaseReengagementStage(
  parentId: string,
  claimKey: string,
): Promise<void> {
  const oid = toObjectId(parentId);
  if (!oid) return;
  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne({ _id: oid }, { $pull: { reengagement_sent: claimKey } });
}

/** Record a sent re-engagement email for the admin measurement panel. */
export async function recordReengagementEvent(input: {
  parentId: string;
  stage: ReengStage;
  track: ReengTrack;
  tier: ParentDoc["subscription_tier"];
  billingStatus: ParentDoc["billing_status"];
  idleSince: Date;
  reactivationWindowMs: number;
}): Promise<void> {
  const oid = toObjectId(input.parentId);
  if (!oid) return;
  const now = new Date();
  const col = await getCollection<ReengagementEventDoc>(
    Collections.reengagementEvents,
  );
  await col.insertOne({
    parent_id: oid,
    stage: input.stage,
    track: input.track,
    tier: input.tier,
    billing_status: input.billingStatus,
    idle_since: input.idleSince,
    sent_at: now,
    reactivate_by: new Date(now.getTime() + input.reactivationWindowMs),
  } as ReengagementEventDoc);
}

export interface ReengagementStageStat {
  stage: ReengStage;
  sent: number;
  /** Sends where the parent became active again before `reactivate_by`. */
  reactivated: number;
}

export interface ReengagementStats {
  totalSent: number;
  byStage: ReengagementStageStat[];
  byTrack: { upsell: number; reengage: number };
  /** Re-activated sends / total sends (the KPI), 0–1, or null when no sends. */
  reactivationRate: number | null;
  /** Distinct parents emailed who are now opted out / distinct emailed, 0–1. */
  unsubscribeRate: number | null;
  distinctParents: number;
  optedOutParents: number;
  recent: {
    stage: ReengStage;
    track: ReengTrack;
    tier: string;
    sentAt: Date;
    reactivated: boolean;
  }[];
}

/**
 * Real re-engagement measurement for the admin panel. Re-activation is honest:
 * a send counts as re-activated only when the parent's CURRENT `last_active`
 * advanced past the send AND landed before that send's attribution deadline
 * (`reactivate_by`). Unsubscribe rate is the share of emailed parents now opted
 * out of marketing. All computed from real rows — nothing illustrative.
 */
export async function reengagementStats(): Promise<ReengagementStats> {
  const eventsCol = await getCollection<ReengagementEventDoc>(
    Collections.reengagementEvents,
  );
  const events = await eventsCol.find({}).sort({ sent_at: -1 }).toArray();

  const empty: ReengagementStats = {
    totalSent: 0,
    byStage: ([1, 2, 3] as ReengStage[]).map((stage) => ({
      stage,
      sent: 0,
      reactivated: 0,
    })),
    byTrack: { upsell: 0, reengage: 0 },
    reactivationRate: null,
    unsubscribeRate: null,
    distinctParents: 0,
    optedOutParents: 0,
    recent: [],
  };
  if (events.length === 0) return empty;

  // Current activity + opt-out for every emailed parent (one indexed batch read).
  const parentIds = [...new Set(events.map((e) => e.parent_id.toHexString()))];
  const parentCol = await getCollection<ParentDoc>(Collections.parents);
  const parents = await parentCol
    .find({ _id: { $in: parentIds.map((id) => new ObjectId(id)) } })
    .project({ last_active: 1, marketing_emails_opt_out: 1 })
    .toArray();
  const lastActiveById = new Map<string, Date | null>();
  const optedOutById = new Map<string, boolean>();
  for (const p of parents) {
    lastActiveById.set(p._id!.toHexString(), (p.last_active as Date) ?? null);
    optedOutById.set(
      p._id!.toHexString(),
      Boolean((p as ParentDoc).marketing_emails_opt_out),
    );
  }

  const reactivated = (e: ReengagementEventDoc): boolean => {
    const la = lastActiveById.get(e.parent_id.toHexString());
    if (!la) return false;
    return la.getTime() > e.sent_at.getTime() && la <= e.reactivate_by;
  };

  const byStageMap = new Map<ReengStage, ReengagementStageStat>(
    ([1, 2, 3] as ReengStage[]).map((s) => [
      s,
      { stage: s, sent: 0, reactivated: 0 },
    ]),
  );
  let reactCount = 0;
  const byTrack = { upsell: 0, reengage: 0 };
  for (const e of events) {
    const row = byStageMap.get(e.stage);
    if (row) {
      row.sent++;
      if (reactivated(e)) row.reactivated++;
    }
    if (reactivated(e)) reactCount++;
    if (e.track === "upsell") byTrack.upsell++;
    else byTrack.reengage++;
  }

  const optedOutParents = parentIds.filter((id) => optedOutById.get(id)).length;

  return {
    totalSent: events.length,
    byStage: [...byStageMap.values()],
    byTrack,
    reactivationRate: events.length ? reactCount / events.length : null,
    unsubscribeRate: parentIds.length ? optedOutParents / parentIds.length : null,
    distinctParents: parentIds.length,
    optedOutParents,
    recent: events.slice(0, 20).map((e) => ({
      stage: e.stage,
      track: e.track,
      tier: e.tier,
      sentAt: e.sent_at,
      reactivated: reactivated(e),
    })),
  };
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
  const reengCol = await getCollection<ReengagementEventDoc>(
    Collections.reengagementEvents,
  );
  deleted[Collections.reengagementEvents] = (
    await reengCol.deleteMany({ parent_id: parentOid })
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

// ── Admin operations console (staff mgmt + full family control) ───────────
//
// Every mutation here is admin-gated and audited-with-reason. The privileged
// guards (last-admin, self-lockout, reason required, typed confirmation) live in
// lib/auth/staff-guards.ts as pure functions and are enforced HERE server-side
// as well as in the UI — the UI can never substitute for these checks.

/** Count accounts that currently resolve to the admin role (role or legacy is_admin). */
export async function countAdmins(): Promise<number> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  return col.countDocuments({
    $or: [{ role: "admin" }, { role: { $exists: false }, is_admin: true }],
  });
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  grantedByEmail: string | null;
  grantedAt: Date | null;
}

/** All staff accounts (admin/support), with who granted the role and when. */
export async function listStaff(): Promise<StaffMember[]> {
  const col = await getCollection<ParentDoc>(Collections.parents);
  const rows = await col
    .find({ $or: [{ role: { $in: ["admin", "support"] } }, { is_admin: true }] })
    .sort({ email: 1 })
    .toArray();

  const granterIds = [
    ...new Set(rows.map((r) => r.role_granted_by?.toHexString()).filter(Boolean)),
  ] as string[];
  const granterEmail = new Map<string, string>();
  if (granterIds.length > 0) {
    const granters = await col
      .find(
        { _id: { $in: granterIds.map((id) => new ObjectId(id)) } },
        { projection: { email: 1 } },
      )
      .toArray();
    for (const g of granters) granterEmail.set(g._id!.toHexString(), g.email);
  }

  return rows
    .map((r) => {
      const role = resolveRole({ role: r.role, is_admin: r.is_admin });
      if (!role) return null;
      return {
        id: r._id!.toHexString(),
        name: r.full_name ?? "—",
        email: r.email,
        role,
        grantedByEmail: r.role_granted_by
          ? granterEmail.get(r.role_granted_by.toHexString()) ?? null
          : null,
        grantedAt: r.role_granted_at ?? null,
      } satisfies StaffMember;
    })
    .filter((x): x is StaffMember => x !== null);
}

/**
 * Grant / change / revoke a staff role. Gathers the live facts, runs the pure
 * guard (admin-only, reason required, no self-lockout, no last-admin removal),
 * applies the change, then writes an audit row with before→after + reason.
 * Revoking clears both `role` and the legacy `is_admin` flag.
 */
export async function setStaffRole(input: {
  actorId: string;
  actorEmail: string;
  targetId: string;
  nextRole: NextRole;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  const actorRole = actor
    ? resolveRole({ role: actor.role, is_admin: actor.is_admin })
    : null;
  const target = await findParentById(input.targetId);
  if (!target?._id) return { ok: false, error: "Target account not found." };
  const targetCurrentRole = resolveRole({
    role: target.role,
    is_admin: target.is_admin,
  });
  const adminCount = await countAdmins();

  const decision = evaluateRoleChange({
    actorRole,
    actorId: input.actorId,
    targetId: input.targetId,
    targetCurrentRole,
    nextRole: input.nextRole,
    reason: input.reason,
    adminCount,
  });
  if (!decision.ok) return decision;

  const col = await getCollection<ParentDoc>(Collections.parents);
  const now = new Date();
  const actorOid = toObjectId(input.actorId);
  if (input.nextRole === null) {
    await col.updateOne(
      { _id: target._id },
      {
        $unset: { role: "", is_admin: "" },
        $set: { role_granted_by: actorOid, role_granted_at: now, updated_at: now },
      },
    );
  } else {
    await col.updateOne(
      { _id: target._id },
      {
        $set: {
          role: input.nextRole,
          role_granted_by: actorOid,
          role_granted_at: now,
          updated_at: now,
        },
        $unset: { is_admin: "" },
      },
    );
  }

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: input.nextRole === null ? "staff.role.revoke" : "staff.role.grant",
    targetCollection: Collections.parents,
    targetId: input.targetId,
    reason: input.reason,
    before: targetCurrentRole ?? "parent",
    after: input.nextRole ?? "parent",
    ip: input.ip ?? null,
  });
  return { ok: true };
}

export interface AdminChildSummary {
  id: string;
  name: string;
  dateOfBirth: string;
  joinedAt: string;
}

export interface AdminParentDetail {
  id: string;
  name: string;
  email: string;
  tier: SubscriptionTier;
  status: BillingStatus;
  role: StaffRole | null;
  verified: boolean;
  suspended: boolean;
  manualOverride: boolean;
  hasStripe: boolean;
  joinedAt: string;
  children: AdminChildSummary[];
}

/** Minimum-PII account detail for a specific family being acted on by staff. */
export async function getAdminParentDetail(
  parentId: string,
): Promise<AdminParentDetail | null> {
  const parent = await findParentById(parentId);
  if (!parent?._id) return null;
  const children = await listChildren(parentId);
  return {
    id: parent._id.toHexString(),
    name: parent.full_name ?? "—",
    email: parent.email,
    tier: (parent.subscription_tier ?? "diagnostic") as SubscriptionTier,
    status: (parent.billing_status ?? "trialing") as BillingStatus,
    role: resolveRole({ role: parent.role, is_admin: parent.is_admin }),
    verified: parent.email_verified !== false,
    suspended: parent.suspended === true,
    manualOverride: parent.billing_manual_override === true,
    hasStripe: Boolean(parent.stripe_customer_id),
    joinedAt: parent.created_at
      ? new Date(parent.created_at).toISOString().slice(0, 10)
      : "—",
    children: children.map((c) => ({
      id: c._id!.toHexString(),
      name: c.full_name,
      dateOfBirth: c.date_of_birth,
      joinedAt: c.created_at
        ? new Date(c.created_at).toISOString().slice(0, 10)
        : "—",
    })),
  };
}

/**
 * Suspend / unsuspend an account (reversible). Guarded (admin-only, reason,
 * not-self, not-last-admin). Suspending bumps token_version so existing
 * sessions are invalidated immediately. Audited with reason.
 */
export async function setAccountSuspended(input: {
  actorId: string;
  actorEmail: string;
  targetId: string;
  suspend: boolean;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  const actorRole = actor
    ? resolveRole({ role: actor.role, is_admin: actor.is_admin })
    : null;
  const target = await findParentById(input.targetId);
  if (!target?._id) return { ok: false, error: "Target account not found." };
  const targetIsAdmin =
    resolveRole({ role: target.role, is_admin: target.is_admin }) === "admin";
  const adminCount = await countAdmins();

  const decision = evaluateAccountAction({
    actorRole,
    actorId: input.actorId,
    targetId: input.targetId,
    targetIsAdmin,
    reason: input.reason,
    adminCount,
  });
  if (!decision.ok) return decision;

  const col = await getCollection<ParentDoc>(Collections.parents);
  const now = new Date();
  await col.updateOne(
    { _id: target._id },
    {
      $set: {
        suspended: input.suspend,
        suspended_at: input.suspend ? now : null,
        updated_at: now,
      },
      ...(input.suspend ? { $inc: { token_version: 1 } } : {}),
    },
  );

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: input.suspend ? "account.suspend" : "account.unsuspend",
    targetCollection: Collections.parents,
    targetId: input.targetId,
    reason: input.reason,
    before: target.suspended === true ? "suspended" : "active",
    after: input.suspend ? "suspended" : "active",
    ip: input.ip ?? null,
  });
  return { ok: true };
}

/**
 * Apply a MANUAL plan override (comp/grant/downgrade) — sets the tier + status
 * directly and flags the account `billing_manual_override` so the UI shows
 * "manual — not Stripe-synced". Never mutates Stripe (the webhook stays the
 * source of truth for Stripe-driven changes). Admin-only, reason required,
 * audited with before→after.
 */
export async function adminSetBilling(input: {
  actorId: string;
  actorEmail: string;
  targetId: string;
  tier: SubscriptionTier;
  status: BillingStatus;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  const actorRole = actor
    ? resolveRole({ role: actor.role, is_admin: actor.is_admin })
    : null;
  if (actorRole !== "admin") {
    return { ok: false, error: "Only an admin can change a plan." };
  }
  const reasonCheck = requireReason(input.reason);
  if (!reasonCheck.ok) return reasonCheck;

  const target = await findParentById(input.targetId);
  if (!target?._id) return { ok: false, error: "Target account not found." };

  const col = await getCollection<ParentDoc>(Collections.parents);
  await col.updateOne(
    { _id: target._id },
    {
      $set: {
        subscription_tier: input.tier,
        billing_status: input.status,
        billing_manual_override: true,
        updated_at: new Date(),
      },
    },
  );

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: "account.plan.override",
    targetCollection: Collections.parents,
    targetId: input.targetId,
    reason: input.reason,
    before: `${target.subscription_tier}/${target.billing_status}`,
    after: `${input.tier}/${input.status} (manual)`,
    ip: input.ip ?? null,
  });
  return { ok: true };
}

/** Admin-add a child to any parent (respects nothing but the target parent id). */
export async function adminAddChild(input: {
  actorId: string;
  actorEmail: string;
  parentId: string;
  fullName: string;
  dateOfBirth: string;
  targetExamWindow: string | null;
  sendIndicators: string[];
  reason: string;
  ip?: string | null;
}): Promise<GuardResult & { childId?: string }> {
  const actor = await findParentById(input.actorId);
  if (resolveRole({ role: actor?.role, is_admin: actor?.is_admin }) !== "admin") {
    return { ok: false, error: "Only an admin can add a child." };
  }
  const reasonCheck = requireReason(input.reason);
  if (!reasonCheck.ok) return reasonCheck;
  if (!input.fullName.trim() || !input.dateOfBirth) {
    return { ok: false, error: "Child name and date of birth are required." };
  }
  const parent = await findParentById(input.parentId);
  if (!parent?._id) return { ok: false, error: "Parent account not found." };

  const childId = await createChild({
    parentId: input.parentId,
    fullName: input.fullName.trim(),
    dateOfBirth: input.dateOfBirth,
    targetExamWindow: input.targetExamWindow,
    sendIndicators: input.sendIndicators,
  });
  if (!childId) return { ok: false, error: "Could not create the child." };

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: "child.create",
    targetCollection: Collections.children,
    targetId: childId,
    reason: input.reason,
    before: null,
    after: `${input.fullName.trim()} → parent ${input.parentId}`,
    ip: input.ip ?? null,
  });
  return { ok: true, childId };
}

/** Admin-edit a child of any parent (name / DOB / exam window / SEND). */
export async function adminUpdateChild(input: {
  actorId: string;
  actorEmail: string;
  parentId: string;
  childId: string;
  patch: Partial<
    Pick<ChildDoc, "full_name" | "date_of_birth" | "send_indicators" | "target_exam_window">
  >;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  if (resolveRole({ role: actor?.role, is_admin: actor?.is_admin }) !== "admin") {
    return { ok: false, error: "Only an admin can edit a child." };
  }
  const reasonCheck = requireReason(input.reason);
  if (!reasonCheck.ok) return reasonCheck;

  // updateChild verifies the child belongs to the target parent (ownership).
  const ok = await updateChild(input.parentId, input.childId, input.patch);
  if (!ok) return { ok: false, error: "Child not found for that parent." };

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: "child.update",
    targetCollection: Collections.children,
    targetId: input.childId,
    reason: input.reason,
    before: null,
    after: Object.keys(input.patch).join(", ") || "—",
    ip: input.ip ?? null,
  });
  return { ok: true };
}

/**
 * GDPR erasure of a SINGLE child's learning record. Mirrors the family-erasure
 * machinery but scoped to one owned child; verifies the child belongs to the
 * given parent before deleting anything. Returns per-collection counts.
 */
export async function deleteChildData(
  parentId: string,
  childId: string,
): Promise<Record<string, number> | null> {
  const parentOid = toObjectId(parentId);
  const childOid = toObjectId(childId);
  if (!parentOid || !childOid) return null;
  const childCol = await getCollection<ChildDoc>(Collections.children);
  const child = await childCol.findOne({ _id: childOid, parent_id: parentOid });
  if (!child) return null; // ownership guard — never touch another family's child

  const deleted: Record<string, number> = {};
  for (const name of CHILD_SCOPED_COLLECTIONS) {
    const col = await getCollection(name);
    deleted[name] = (await col.deleteMany({ child_id: childOid })).deletedCount;
  }
  const lp = await getCollection(Collections.lessonProgress);
  deleted[Collections.lessonProgress] = (
    await lp.deleteMany({ child_id: childOid })
  ).deletedCount;
  const pe = await getCollection(Collections.parentEvents);
  deleted[Collections.parentEvents] = (
    await pe.deleteMany({ child_id: childOid })
  ).deletedCount;
  deleted[Collections.children] = (
    await childCol.deleteOne({ _id: childOid, parent_id: parentOid })
  ).deletedCount;
  return deleted;
}

/**
 * Admin-delete a child = GDPR erasure of that child's record. Highest-risk
 * child action: admin-only, reason required, and a typed confirmation that
 * matches the child's exact name. Audited with the deletion counts.
 */
export async function adminDeleteChild(input: {
  actorId: string;
  actorEmail: string;
  parentId: string;
  childId: string;
  confirmName: string;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  if (resolveRole({ role: actor?.role, is_admin: actor?.is_admin }) !== "admin") {
    return { ok: false, error: "Only an admin can delete a child." };
  }
  const reasonCheck = requireReason(input.reason);
  if (!reasonCheck.ok) return reasonCheck;

  const child = await getChildById(input.parentId, input.childId);
  if (!child) return { ok: false, error: "Child not found for that parent." };
  if (!confirmationMatches(input.confirmName, child.full_name)) {
    return { ok: false, error: "Confirmation name does not match the child." };
  }

  const deleted = await deleteChildData(input.parentId, input.childId);
  if (!deleted) return { ok: false, error: "Could not delete the child." };

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: "child.delete",
    targetCollection: Collections.children,
    targetId: input.childId,
    reason: input.reason,
    before: child.full_name,
    after: JSON.stringify(deleted),
    ip: input.ip ?? null,
  });
  return { ok: true };
}

/**
 * Admin-delete an entire family = GDPR erasure via the existing deleteFamilyData
 * path (never a raw deleteOne). Guarded (admin-only, reason, not-self,
 * not-last-admin) plus a typed confirmation matching the parent's email.
 * Audited with the per-collection deletion counts.
 */
export async function adminDeleteFamily(input: {
  actorId: string;
  actorEmail: string;
  targetId: string;
  confirmEmail: string;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  const actorRole = actor
    ? resolveRole({ role: actor.role, is_admin: actor.is_admin })
    : null;
  const target = await findParentById(input.targetId);
  if (!target?._id) return { ok: false, error: "Target account not found." };
  const targetIsAdmin =
    resolveRole({ role: target.role, is_admin: target.is_admin }) === "admin";
  const adminCount = await countAdmins();

  const decision = evaluateAccountAction({
    actorRole,
    actorId: input.actorId,
    targetId: input.targetId,
    targetIsAdmin,
    reason: input.reason,
    adminCount,
  });
  if (!decision.ok) return decision;
  if (!confirmationMatches(input.confirmEmail, target.email)) {
    return { ok: false, error: "Confirmation email does not match the account." };
  }

  const deleted = await deleteFamilyData(input.targetId);
  if (!deleted) return { ok: false, error: "Could not delete the family." };

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: "family.delete",
    targetCollection: Collections.parents,
    targetId: input.targetId,
    reason: input.reason,
    before: target.email,
    after: JSON.stringify(deleted),
    ip: input.ip ?? null,
  });
  return { ok: true };
}

// ── Persisted feature flags (app settings) ────────────────────────────────

/** Read the persisted feature-flag overrides ({} when none set). */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const col = await getCollection(Collections.settings);
  const doc = await col.findOne({ _id: "feature_flags" as unknown as ObjectId });
  const flags = (doc as { flags?: Record<string, boolean> } | null)?.flags;
  return flags ?? {};
}

/**
 * Set one feature-flag override. Admin-only, reason required, only for KNOWN
 * wired flags (never arbitrary keys), audited with before→after.
 */
export async function setFeatureFlag(input: {
  actorId: string;
  actorEmail: string;
  key: string;
  enabled: boolean;
  reason: string;
  ip?: string | null;
}): Promise<GuardResult> {
  const actor = await findParentById(input.actorId);
  if (resolveRole({ role: actor?.role, is_admin: actor?.is_admin }) !== "admin") {
    return { ok: false, error: "Only an admin can change settings." };
  }
  const reasonCheck = requireReason(input.reason);
  if (!reasonCheck.ok) return reasonCheck;
  if (!isKnownFlag(input.key)) return { ok: false, error: "Unknown flag." };

  const before = await getFeatureFlags();
  const col = await getCollection(Collections.settings);
  await col.updateOne(
    { _id: "feature_flags" as unknown as ObjectId },
    { $set: { [`flags.${input.key}`]: input.enabled, updated_at: new Date() } },
    { upsert: true },
  );

  await recordStaffAction({
    staffId: input.actorId,
    staffEmail: input.actorEmail,
    action: "settings.flag",
    targetCollection: Collections.settings,
    targetId: input.key,
    reason: input.reason,
    before: String(before[input.key] ?? "default"),
    after: String(input.enabled),
    ip: input.ip ?? null,
  });
  return { ok: true };
}

// ── Users list: search / filter / paginate ────────────────────────────────

export interface AdminParentsPage {
  rows: (AdminParentRow & {
    suspended: boolean;
    manualOverride: boolean;
    verified: boolean;
  })[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated, filterable parent list for the admin users console. Filters:
 * free-text (name/email), billing status, and tier. Never returns child names
 * on this cross-family surface — only a per-parent count.
 */
export async function adminSearchParents(opts: {
  query?: string;
  status?: BillingStatus | "all";
  tier?: SubscriptionTier | "all";
  page?: number;
  pageSize?: number;
}): Promise<AdminParentsPage> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, opts.pageSize ?? 20));

  const filter: Record<string, unknown> = {};
  const q = (opts.query ?? "").trim();
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ email: rx }, { full_name: rx }];
  }
  if (opts.status && opts.status !== "all") filter.billing_status = opts.status;
  if (opts.tier && opts.tier !== "all") filter.subscription_tier = opts.tier;

  const parentsCol = await getCollection<ParentDoc>(Collections.parents);
  const total = await parentsCol.countDocuments(filter);
  const parents = await parentsCol
    .find(filter, {
      projection: {
        full_name: 1,
        email: 1,
        subscription_tier: 1,
        billing_status: 1,
        created_at: 1,
        suspended: 1,
        billing_manual_override: 1,
        email_verified: 1,
      },
    })
    .sort({ created_at: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const parentOids = parents.map((p) => p._id!).filter(Boolean);
  const childCountByParent = new Map<string, number>();
  if (parentOids.length > 0) {
    const childrenCol = await getCollection<ChildDoc>(Collections.children);
    const counts = await childrenCol
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { parent_id: { $in: parentOids } } },
        { $group: { _id: "$parent_id", count: { $sum: 1 } } },
      ])
      .toArray();
    for (const c of counts) {
      if (c._id) childCountByParent.set(c._id.toHexString(), c.count);
    }
  }

  return {
    total,
    page,
    pageSize,
    rows: parents.map((p) => {
      const id = p._id!.toHexString();
      return {
        id,
        name: p.full_name ?? "—",
        email: p.email,
        tier: (p.subscription_tier ?? "diagnostic") as SubscriptionTier,
        status: (p.billing_status ?? "trialing") as BillingStatus,
        joinedAt: p.created_at
          ? new Date(p.created_at).toISOString().slice(0, 10)
          : "—",
        childCount: childCountByParent.get(id) ?? 0,
        suspended: p.suspended === true,
        manualOverride: p.billing_manual_override === true,
        verified: p.email_verified !== false,
      };
    }),
  };
}

// ── Parent sentiment feedback (voluntary star + comment) ─────────────────
//
// PARENT-SIDE ONLY. Every function is keyed on the session parent's OWN id, so
// the data-silo holds by construction (a parent can only ever read/write their
// own prompt state + submissions; the admin reads are staff-gated by the
// (admin) layout). No child data is ever touched here. The pure decision +
// validation live in `lib/engine/feedback-eligibility.ts` (unit-tested).

/**
 * Gather the raw prompt state + milestone signal for a parent, for the pure
 * `shouldShowFeedbackPrompt` decision. Cheap counts over the family's own
 * records; returns a "never eligible" zero signal for an unknown/childless
 * parent so the prompt simply never shows.
 */
export async function getFeedbackPromptContext(
  parentId: string,
): Promise<{ state: FeedbackPromptState; signal: FeedbackMilestoneSignal }> {
  const empty = {
    state: {
      lastShownAt: null,
      lastSubmittedAt: null,
      lastDismissedAt: null,
      optedOut: false,
    } satisfies FeedbackPromptState,
    signal: { completedLessons: 0, certifiedTopics: 0 } satisfies FeedbackMilestoneSignal,
  };

  const parentOid = toObjectId(parentId);
  if (!parentOid) return empty;
  const parent = await findParentById(parentId);
  if (!parent) return empty;

  const childCol = await getCollection<ChildDoc>(Collections.children);
  const childIds = (
    await childCol
      .find({ parent_id: parentOid })
      .project<{ _id: ObjectId }>({ _id: 1 })
      .toArray()
  ).map((d) => d._id);

  let completedLessons = 0;
  let certifiedTopics = 0;
  if (childIds.length) {
    const logCol = await getCollection<LessonLogDoc>(Collections.lessonLogs);
    const compCol = await getCollection<CompetenceDoc>(Collections.competence);
    [completedLessons, certifiedTopics] = await Promise.all([
      logCol.countDocuments({ child_id: { $in: childIds }, status: "completed" }),
      compCol.countDocuments({ child_id: { $in: childIds }, state: "certified" }),
    ]);
  }

  return {
    state: {
      lastShownAt: parent.feedback_last_shown_at ?? null,
      lastSubmittedAt: parent.feedback_last_submitted_at ?? null,
      lastDismissedAt: parent.feedback_last_dismissed_at ?? null,
      optedOut: parent.feedback_opt_out === true,
    },
    signal: { completedLessons, certifiedTopics },
  };
}

/**
 * Record a feedback submission (parent-scoped) and stamp the long post-submit
 * cooldown on the parent so the milestone prompt can't re-nag. `stars` MUST be a
 * validated 1–5 integer and `comment` an already-sanitized string|null (the
 * caller — /api/feedback — enforces this via the pure validators). Returns the
 * new row id, or null if the parent id is invalid.
 */
export async function submitFeedback(
  parentId: string,
  input: {
    stars: number;
    comment: string | null;
    trigger: FeedbackTrigger;
    context?: string | null;
  },
): Promise<string | null> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return null;
  // Defence in depth — never persist an out-of-range rating.
  if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
    return null;
  }
  const parent = await findParentById(parentId);
  if (!parent) return null;

  const now = new Date();
  const col = await getCollection<FeedbackDoc>(Collections.feedback);
  const res = await col.insertOne({
    parent_id: parentOid,
    parent_name: parent.full_name ?? null,
    parent_email: parent.email,
    stars: input.stars,
    comment: input.comment,
    trigger: input.trigger,
    context: input.context ?? null,
    created_at: now,
  } as FeedbackDoc);

  const parentsCol = await getCollection<ParentDoc>(Collections.parents);
  await parentsCol.updateOne(
    { _id: parentOid },
    { $set: { feedback_last_submitted_at: now, updated_at: now } },
  );

  return res.insertedId.toHexString();
}

/**
 * Persist a prompt-state transition for the milestone widget:
 *   - "shown"     → stamp last_shown_at (audit only; doesn't gate re-show)
 *   - "dismissed" → start the shorter cool-down
 *   - "opt_out"   → "don't ask again", durable suppression
 */
export async function markFeedbackPrompt(
  parentId: string,
  action: "shown" | "dismissed" | "opt_out",
): Promise<void> {
  const parentOid = toObjectId(parentId);
  if (!parentOid) return;
  const now = new Date();
  const set: Record<string, unknown> = { updated_at: now };
  if (action === "shown") set.feedback_last_shown_at = now;
  else if (action === "dismissed") set.feedback_last_dismissed_at = now;
  else if (action === "opt_out") set.feedback_opt_out = true;

  const parentsCol = await getCollection<ParentDoc>(Collections.parents);
  await parentsCol.updateOne({ _id: parentOid }, { $set: set });
}

export interface FeedbackRow {
  id: string;
  parentId: string;
  parentName: string | null;
  parentEmail: string;
  stars: number;
  comment: string | null;
  trigger: FeedbackTrigger;
  createdAt: Date;
}

/**
 * Admin read: most recent feedback submissions, newest first. `maxStars` filters
 * for triage (e.g. surface all ≤ 3-star responses). Staff-gated by the (admin)
 * layout; returns real rows only (no mock).
 */
export async function recentFeedback(
  limit = 50,
  opts?: { maxStars?: number },
): Promise<FeedbackRow[]> {
  const col = await getCollection<FeedbackDoc>(Collections.feedback);
  const query: Record<string, unknown> = {};
  if (typeof opts?.maxStars === "number") {
    query.stars = { $lte: opts.maxStars };
  }
  const docs = await col
    .find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    id: d._id!.toHexString(),
    parentId: d.parent_id.toHexString(),
    parentName: d.parent_name ?? null,
    parentEmail: d.parent_email,
    stars: d.stars,
    comment: d.comment ?? null,
    trigger: d.trigger,
    createdAt: d.created_at,
  }));
}

export interface FeedbackStats {
  total: number;
  /** Mean stars across all responses, 1 d.p.; null when there are none. */
  average: number | null;
  /** Count of ≤ 3-star responses (the triage/outreach bucket). */
  lowCount: number;
  /** Responses per star, index 0 = 1★ … index 4 = 5★. */
  distribution: [number, number, number, number, number];
  /** Oldest → newest weekly buckets (last 8 ISO weeks) for the trend line. */
  weeklyTrend: { weekStart: string; average: number | null; count: number }[];
}

/** Admin read: platform-wide sentiment — average, distribution, weekly trend. */
export async function feedbackStats(): Promise<FeedbackStats> {
  const col = await getCollection<FeedbackDoc>(Collections.feedback);

  const WEEKS = 8;
  const now = new Date();
  // Monday-anchored week starts (UTC), oldest first.
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const dayIdx = (now.getUTCDay() + 6) % 7; // 0 = Monday
  const thisWeekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayIdx),
  );
  const buckets: { weekStart: string; start: number; sum: number; count: number }[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const start = thisWeekStart.getTime() - i * msPerWeek;
    buckets.push({
      weekStart: new Date(start).toISOString().slice(0, 10),
      start,
      sum: 0,
      count: 0,
    });
  }
  const windowStart = buckets[0].start;

  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let total = 0;
  let sum = 0;
  let lowCount = 0;

  // Single pass over all feedback (small volume at this scale). Only fields we
  // need are projected; no PII beyond stars/created_at is read here.
  const cursor = col
    .find({}, { projection: { stars: 1, created_at: 1 } })
    .sort({ created_at: -1 });
  for await (const d of cursor) {
    const stars = d.stars;
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) continue;
    total += 1;
    sum += stars;
    distribution[stars - 1] += 1;
    if (stars <= 3) lowCount += 1;
    const t = new Date(d.created_at).getTime();
    if (t >= windowStart) {
      const idx = Math.min(WEEKS - 1, Math.floor((t - windowStart) / msPerWeek));
      if (idx >= 0) {
        buckets[idx].sum += stars;
        buckets[idx].count += 1;
      }
    }
  }

  return {
    total,
    average: total ? Math.round((sum / total) * 10) / 10 : null,
    lowCount,
    distribution,
    weeklyTrend: buckets.map((b) => ({
      weekStart: b.weekStart,
      average: b.count ? Math.round((b.sum / b.count) * 10) / 10 : null,
      count: b.count,
    })),
  };
}
