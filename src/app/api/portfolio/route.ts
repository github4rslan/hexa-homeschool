import { NextResponse } from "next/server";
import { generateVerifiedPortfolio } from "@/lib/compliance/portfolio";
import {
  currentParentId,
  findChildByName,
  getChildById,
  insertDossier,
} from "@/lib/db/repo";

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

export async function POST(request: Request) {
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
  if (childId) {
    const parentId = await currentParentId();
    const child = parentId ? await getChildById(parentId, childId) : null;
    if (child?.full_name) childName = child.full_name;
  }

  if (!childName || !term) {
    return NextResponse.json(
      { error: "'childName' (or 'childId') and 'term' are required." },
      { status: 400 },
    );
  }

  try {
    const portfolio = await generateVerifiedPortfolio({ childName, term });
    const persisted = await persistDossier(
      { childId: childId || undefined, childName },
      term,
      portfolio.verificationHash,
    );
    return NextResponse.json(
      { ...portfolio, persisted },
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
