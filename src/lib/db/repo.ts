import "server-only";
import { ObjectId } from "mongodb";
import { getCollection, Collections } from "@/lib/mongodb";
import { getSession } from "@/lib/auth/session";
import { computeStreak } from "@/lib/engine/streak";
import { sha256Hex } from "@/lib/compliance/portfolio";
import {
  buildInsights,
  type Insight,
  type LessonSample,
  type MoodSample,
} from "@/lib/engine/insights";
import {
  scheduleFirstReview,
  nextReview,
  isReviewDue,
} from "@/lib/engine/spaced-repetition";
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
  MessageDoc,
  StaffAuditLogDoc,
  Subject,
} from "./types";
import { resolveRole, type StaffRole } from "@/lib/auth/rbac";

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

  // Next month's focus: next uncertified topics per subject (overall, not month-bound).
  const allCertified = new Set(
    (await compCol.find({ child_id: childId, state: "certified" }).toArray()).map(
      (c) => c.topic_tag,
    ),
  );
  const subjects: Subject[] = ["mathematics", "english", "science"];
  const nextFocus: { title: string; subject: Subject }[] = [];
  for (const subj of subjects) {
    const topics = await topicsCol.find({ subject: subj }).sort({ order: 1 }).toArray();
    const next = topics.find((t) => !allCertified.has(t.topic_tag));
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
  const start = new Date(`${weekStart}T00:00:00`);
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
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
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
  const subjectByTag = new Map(topics.map((t) => [t.topic_tag, t.subject]));
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Monday

  const quests: TodayQuest[] = (schedule?.items ?? [])
    .filter((it) => it.day === todayIndex)
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
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
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
  const col = await getCollection<EvaluationDoc>(Collections.evaluations);
  await col.insertOne({
    child_id: childId,
    subject: input.subject,
    raw_score: input.scorePct,
    model_predicted_grade: input.indicativeGrade,
    confidence_interval: Math.min(0.99, Math.max(0.5, input.scorePct / 100)),
    mock_exam: true,
    created_at: new Date(),
  } as EvaluationDoc);
  return true;
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

  const items = await buildScheduleItems(childId);
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

/**
 * Build a fresh week of plan items from the child's curriculum gaps: the next
 * not-yet-certified topic per subject, one per weekday (Mon=Maths, Tue=English,
 * Wed=Science, Thu=Maths, Fri=English), with a data-grounded reason per item.
 * Pure of any persistence so both initial generation and regeneration share it.
 */
async function buildScheduleItems(childId: ObjectId): Promise<ScheduleItemDoc[]> {
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

/**
 * Set a child's personalisation choices (narration voice + child-mode accent).
 * Both optional; only provided fields are written. Ownership enforced — the
 * child must belong to the parent. Validation of allowed values happens in the
 * calling action.
 */
export async function setChildPreferences(
  parentId: string,
  childId: ObjectId,
  prefs: { voiceId?: string | null; accent?: string | null },
): Promise<boolean> {
  if (!(await assertOwnsChild(parentId, childId))) return false;
  const set: Partial<ChildDoc> = { updated_at: new Date() };
  if (prefs.voiceId !== undefined) set.voice_id = prefs.voiceId;
  if (prefs.accent !== undefined) set.accent = prefs.accent;
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
