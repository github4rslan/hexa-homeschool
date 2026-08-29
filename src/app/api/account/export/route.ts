import { NextResponse } from "next/server";
import { currentParentId, exportFamilyData } from "@/lib/db/repo";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/account/export — UK GDPR data access: download the signed-in
 * family's documents as JSON. Parent-scoped end to end in the repo layer;
 * password/PIN hashes are stripped before serialisation.
 */
export async function GET() {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // B4 (2026-08-29) — this fans out to eight child-scoped collections plus
  // tutor bookings per hit. Generous per-parent limit so a normal "download my
  // data" click never trips it, matching the pattern already used for
  // similarly expensive authenticated routes (e.g. /api/media/sign).
  const limited = await rateLimit(`account-export:${parentId}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  const data = await exportFamilyData(parentId);
  if (!data) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hexa-family-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
