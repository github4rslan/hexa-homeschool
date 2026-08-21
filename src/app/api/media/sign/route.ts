import { NextResponse } from "next/server";
import { currentParentId, parentOwnsChild } from "@/lib/db/repo";
import {
  buildSignedUpload,
  MediaConfigError,
  type MediaUseCase,
} from "@/lib/media/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a short-lived signature for a direct browser → Cloudinary upload.
 * Enforces auth, per-use-case folder, public/private mode, and (for child_work)
 * ownership of the target child. The browser never sees the API secret.
 */
export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // F4 (2026-08-22) — defence-in-depth: this issues a fresh signed Cloudinary
  // upload credential on every hit. Generous per-parent limit so a normal
  // multi-photo "add work" flow never trips it.
  const limited = await rateLimit(`media-sign:${parentId}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let body: { useCase?: unknown; childId?: unknown };
  try {
    body = (await request.json()) as { useCase?: unknown; childId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const useCase = String(body.useCase ?? "") as MediaUseCase;
  const childId = typeof body.childId === "string" ? body.childId : undefined;

  if (!["marketing", "child_work", "resource"].includes(useCase)) {
    return NextResponse.json({ error: "Invalid use case." }, { status: 400 });
  }

  // child_work is private + must belong to a child this parent owns.
  if (useCase === "child_work") {
    if (!childId || !(await parentOwnsChild(parentId, childId))) {
      return NextResponse.json(
        { error: "You do not have access to this child." },
        { status: 403 },
      );
    }
  }

  const authenticated = useCase === "child_work";

  try {
    const signed = buildSignedUpload({
      useCase,
      subPath: useCase === "child_work" ? childId : undefined,
      resourceType: "auto",
      authenticated,
    });
    return NextResponse.json(signed, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof MediaConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[/api/media/sign] failed:", err);
    return NextResponse.json({ error: "Could not sign upload." }, { status: 500 });
  }
}
