import { NextResponse } from "next/server";
import { currentParentId, submitFeedback, markFeedbackPrompt } from "@/lib/db/repo";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateStars,
  sanitizeComment,
  isValidTrigger,
} from "@/lib/engine/feedback-eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Parent sentiment feedback endpoint. PARENT-SIDE ONLY — every write is keyed on
 * the session parent's own id (data-silo holds by construction), and no child
 * data is ever read or written here.
 *
 *   POST  { stars, comment?, trigger, context? }  → record a submission
 *           (untrusted input: validated + sanitized here, rate-limited per user)
 *   PATCH { action: "shown" | "dismissed" | "opt_out" } → prompt-state
 *           transition so the milestone widget can never re-nag.
 */

export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Light per-user limit — feedback is low-frequency; this only stops abuse.
  const limited = await rateLimit(`feedback:${parentId}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "You've sent feedback recently — thank you! Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const stars = validateStars(body.stars);
  if (stars === null) {
    return NextResponse.json(
      { error: "Please choose a rating from 1 to 5 stars." },
      { status: 400 },
    );
  }

  const comment = sanitizeComment(body.comment);
  const trigger = isValidTrigger(body.trigger) ? body.trigger : "manual";
  const context =
    typeof body.context === "string" ? body.context.slice(0, 200) : null;

  const id = await submitFeedback(parentId, { stars, comment, trigger, context });
  if (!id) {
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }
  return NextResponse.json(
    { ok: true, id },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "shown" && action !== "dismissed" && action !== "opt_out") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  await markFeedbackPrompt(parentId, action);
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
