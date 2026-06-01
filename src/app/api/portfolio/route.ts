import { NextResponse } from "next/server";
import { generateVerifiedPortfolio } from "@/lib/compliance/portfolio";
import { currentParentId, findChildByName, insertDossier } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Best-effort persistence to the dossiers collection (brief's "portfolio").
 * Returns true if a doc was written. Never throws — a generated portfolio is
 * still returned even if persistence is skipped (no session / no matching
 * child). Ownership is enforced in the repo layer.
 */
async function persistDossier(
  childName: string,
  term: string,
  verificationHash: string,
): Promise<boolean> {
  try {
    const parentId = await currentParentId();
    if (!parentId) return false;

    const child = await findChildByName(parentId, childName);
    if (!child?._id) return false;

    return insertDossier(parentId, child._id, term, verificationHash);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: { childName?: unknown; term?: unknown };
  try {
    body = (await request.json()) as { childName?: unknown; term?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const childName =
    typeof body.childName === "string" && body.childName.trim()
      ? body.childName.trim().slice(0, 120)
      : "";
  const term =
    typeof body.term === "string" && body.term.trim()
      ? body.term.trim().slice(0, 60)
      : "";

  if (!childName || !term) {
    return NextResponse.json(
      { error: "'childName' and 'term' are required." },
      { status: 400 },
    );
  }

  try {
    const portfolio = await generateVerifiedPortfolio({ childName, term });
    const persisted = await persistDossier(
      childName,
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
