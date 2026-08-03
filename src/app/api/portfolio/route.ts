import { NextResponse } from "next/server";
import { generateVerifiedPortfolio } from "@/lib/compliance/portfolio";
import {
  currentParentId,
  findChildByName,
  getChildById,
  insertDossier,
  getMockState,
  certifiedBySubject,
  latestEvaluationsBySubject,
  listTopicCertificates,
  topicWorkCounts,
  recentLogs,
  listMedia,
} from "@/lib/db/repo";
import type { ChildDoc } from "@/lib/db/types";
import type { Subject } from "@/lib/db/types";
import { rateLimit } from "@/lib/rate-limit";

const PORTFOLIO_TOPICS_PER_SUBJECT = 10;
const PORTFOLIO_TOTAL_TOPICS = 30;
const SUBJECT_LABELS: Record<Subject, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

function gradeNumber(grade: string | null): number | null {
  if (!grade) return null;
  const nums = grade.match(/\d+/g);
  if (!nums?.length) return null;
  const parsed = Math.max(...nums.map(Number));
  return Number.isFinite(parsed) ? parsed : null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Best-effort persistence to the dossiers collection (brief's "portfolio").
 * Returns true if a doc was written. Never throws — a generated portfolio is
 * still returned even if persistence is skipped (no session / no matching
 * child). Ownership is enforced in the repo layer.
 *
 * Resolution prefers an explicit `childId` (exact, avoids the name-regex hazard
 * of two similarly-named siblings — audit MEDIUM #1); falls back to name match
 * only for legacy callers that don't send an id.
 */
async function persistDossier(
  opts: { childId?: string; childName: string },
  term: string,
  verificationHash: string,
): Promise<boolean> {
  try {
    const parentId = await currentParentId();
    if (!parentId) return false;

    const child = opts.childId
      ? await getChildById(parentId, opts.childId)
      : await findChildByName(parentId, opts.childName);
    if (!child?._id) return false;

    return insertDossier(parentId, child._id, term, verificationHash);
  } catch {
    return false;
  }
}

async function portfolioReadiness(parentId: string, child: ChildDoc) {
  if (!child._id) return null;
  const since = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const [certified, mockState, standings, logs, workEvidence] = await Promise.all([
    certifiedBySubject(child._id),
    getMockState(parentId, child._id),
    latestEvaluationsBySubject(child._id),
    recentLogs([child._id], since, 500),
    listMedia({
      useCase: "child_work",
      childId: child._id.toHexString(),
      limit: 100,
    }),
  ]);
  const certifiedTopics = Math.min(
    PORTFOLIO_TOTAL_TOPICS,
    Object.values(certified).reduce(
      (sum, count) => sum + Math.min(count, PORTFOLIO_TOPICS_PER_SUBJECT),
      0,
    ),
  );
  const grades = standings
    .map((s) => gradeNumber(s.grade))
    .filter((grade): grade is number => grade !== null);
  const latestGrade = grades.length ? Math.round(Math.max(...grades)) : null;
  const mocksTaken = mockState.filter((m) => m.taken).length;
  const totalMocks = mockState.length;
  const lessonsCompleted = logs.filter((l) => l.status === "completed").length;
  const subjects = mockState.map((mock) => {
    const standing = standings.find((s) => s.subject === mock.subject);
    const latestGrade = standing?.grade ?? null;
    return {
      subject: mock.subject,
      label: SUBJECT_LABELS[mock.subject],
      certifiedTopics: Math.min(
        certified[mock.subject] ?? 0,
        PORTFOLIO_TOPICS_PER_SUBJECT,
      ),
      totalTopics: PORTFOLIO_TOPICS_PER_SUBJECT,
      mockTaken: mock.taken,
      mockGrade: mock.result?.indicativeGrade || null,
      latestGrade,
      gradeSource: standing?.fromMock
        ? "Mock exam"
        : latestGrade
          ? "Diagnostic / topic assessment"
          : null,
      assessedAt: standing?.assessedAt?.toISOString() ?? null,
    };
  });
  return {
    status:
      certifiedTopics >= PORTFOLIO_TOTAL_TOPICS &&
      totalMocks > 0 &&
      mocksTaken >= totalMocks
        ? "complete"
        : "in_progress",
    certifiedTopics,
    totalTopics: PORTFOLIO_TOTAL_TOPICS,
    mocksTaken,
    totalMocks,
    lessonsCompleted,
    workEvidenceCount: workEvidence.length,
    latestGrade,
    subjects,
  };
}

export async function POST(request: Request) {
  // Require a session before generating: an unauthenticated caller could
  // otherwise mint fully-rendered, SHA-256-verified portfolios (documents a
  // Local Authority reads as authoritative) for arbitrary free-text names, and
  // burn CPU doing it. A per-parent rate limit bounds the compute.
  const authParentId = await currentParentId();
  if (!authParentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const limited = await rateLimit(`portfolio:${authParentId}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: { childName?: unknown; childId?: unknown; term?: unknown };
  try {
    body = (await request.json()) as {
      childName?: unknown;
      childId?: unknown;
      term?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const childId =
    typeof body.childId === "string" && body.childId.trim()
      ? body.childId.trim()
      : "";
  let childName =
    typeof body.childName === "string" && body.childName.trim()
      ? body.childName.trim().slice(0, 120)
      : "";
  const term =
    typeof body.term === "string" && body.term.trim()
      ? body.term.trim().slice(0, 60)
      : "";

  // When a childId is supplied, resolve the canonical name from it (ownership
  // checked) so the portfolio always reflects the real child, not free text.
  let ownedChild: ChildDoc | null = null;
  if (childId) {
    ownedChild = await getChildById(authParentId, childId);
    if (ownedChild?.full_name) childName = ownedChild.full_name;
  } else if (childName) {
    ownedChild = await findChildByName(authParentId, childName);
  }

  if (!childName || !term) {
    return NextResponse.json(
      { error: "'childName' (or 'childId') and 'term' are required." },
      { status: 400 },
    );
  }

  try {
    // Fold the child's mastery certificates into the dossier as named,
    // tamper-evident Implementation evidence (F3). Ownership-checked; empty for
    // free-text (no id) callers, preserving the prior record byte-for-byte.
    const certs = ownedChild
      ? await listTopicCertificates(authParentId, ownedChild)
      : [];
    const certifiedTopics = certs.map((c) => c.topicTitle);
    // F5: certified topics with a parent-attached photo of the child's written
    // working become named "Photo of written working" evidence in the dossier.
    const workCounts =
      ownedChild?._id
        ? await topicWorkCounts(authParentId, ownedChild._id.toHexString())
        : new Map<string, number>();
    const workEvidenceTopics = certs
      .filter((c) => workCounts.has(c.topicTag))
      .map((c) => c.topicTitle);
    const portfolio = await generateVerifiedPortfolio({
      childName,
      term,
      certifiedTopics,
      workEvidenceTopics,
    });
    const persisted = await persistDossier(
      { childId: childId || undefined, childName },
      term,
      portfolio.verificationHash,
    );
    const readiness = ownedChild
      ? await portfolioReadiness(authParentId, ownedChild)
      : null;
    return NextResponse.json(
      { ...portfolio, persisted, readiness },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[/api/portfolio] generation failed:", err);
    return NextResponse.json(
      { error: "Portfolio generation failed. Please try again." },
      { status: 500 },
    );
  }
}
