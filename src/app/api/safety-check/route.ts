import { NextResponse } from "next/server";
import { checkDistress } from "@/lib/safety/escalation";
import {
  currentParentId,
  getActiveChild,
  recordEscalation,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { rateLimit } from "@/lib/rate-limit";
import { notifyEscalation } from "@/lib/email/escalation-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Distress-only safety gate for free-text child input (e.g. fill-in-the-blank
 * answers in the interactive practice flow). It runs `checkDistress()` and
 * NOTHING else — no AI call, no entitlement gate — so it is cheap enough to scan
 * every typed answer (child-safety rule 2: missing real distress is not
 * acceptable; over-triggering is). On a match it freezes + escalates exactly
 * like /api/tutor; otherwise it returns `{ ok: true }`.
 *
 * Selection-only interactions (mcq / tap_reveal / drag_drop) never reach this —
 * the child only ever picks human-authored options there, so there is no
 * free-text surface to scan.
 */

const MAX_FIELD_LENGTH = 2000;

export async function POST(request: Request) {
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

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ ok: true });
  if (text.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: "Input too long." }, { status: 413 });
  }

  // Distress gate FIRST — it must never be blocked by a rate limit.
  const distress = checkDistress(text);
  if (distress.matched) {
    try {
      const child = await getActiveChild(parentId, await readActiveChildId());
      if (child?._id) {
        await recordEscalation(child._id, {
          trigger: distress.trigger,
          severity: distress.severity,
          matchedText: text,
          phrase: distress.phrase,
        });
        await notifyEscalation(parentId, child.full_name, distress.severity);
      }
    } catch (err) {
      console.error("[/api/safety-check] escalation log failed (still freezing):", err);
    }
    return NextResponse.json(
      {
        frozen: true,
        message:
          "Let's take a pause. It's completely okay to feel stuck — a grown-up has been let know, and they can help you carry on whenever you're ready.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  // No distress: a light per-user limit guards against accidental spam. A clean
  // answer being limited is harmless (the child has already seen local feedback).
  const limited = await rateLimit(`safety:${parentId}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
