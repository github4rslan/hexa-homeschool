import { NextResponse } from "next/server";
import { generateVerifiedPortfolio } from "@/lib/compliance/portfolio";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Best-effort persistence to compliance_dossiers (brief's "portfolio").
 * Returns true if a row was written. Never throws — a generated portfolio is
 * still returned to the caller even if persistence is skipped (e.g. no session,
 * no matching child). RLS guarantees a parent only writes to their own child.
 */
async function persistDossier(
  childName: string,
  term: string,
  verificationHash: string,
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: parent } = await supabase
      .from("parents")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!parent) return false;

    // Match the named child for this parent (case-insensitive).
    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("parent_id", (parent as { id: string }).id)
      .ilike("full_name", childName)
      .limit(1)
      .maybeSingle();
    if (!child) return false;

    const { error } = await supabase.from("compliance_dossiers").insert({
      child_id: (child as { id: string }).id,
      reporting_period: term,
      secure_hash: verificationHash,
    } as never);

    return !error;
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
