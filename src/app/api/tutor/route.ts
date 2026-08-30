import { NextResponse } from "next/server";
import { runTeachingAgent, type TutorRequest } from "@/lib/ai/teaching-agent";
import { AiConfigError } from "@/lib/ai/config";
import { checkDistress } from "@/lib/safety/escalation";
import {
  currentParentId,
  getActiveChild,
  recordEscalation,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { rateLimit } from "@/lib/rate-limit";
import { parentCanUseAi, AI_ENTITLEMENT_ERROR } from "@/lib/billing/entitlement";
import { notifyEscalation } from "@/lib/email/escalation-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reject absurd payloads early — these are short tutoring prompts, not essays. */
const MAX_FIELD_LENGTH = 2000;

/** Per-user budget on the paid OpenAI call. */
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const prompt = asString(body.prompt);
  const correctAnswer = asString(body.correctAnswer);

  if (!prompt || !correctAnswer) {
    return NextResponse.json(
      { error: "Both 'prompt' and 'correctAnswer' are required." },
      { status: 400 },
    );
  }
  if (prompt.length > MAX_FIELD_LENGTH || correctAnswer.length > MAX_FIELD_LENGTH) {
    return NextResponse.json(
      { error: "Input exceeds maximum length." },
      { status: 413 },
    );
  }

  const studentAnswer = asString(body.studentAnswer) || undefined;

  // ── Safety gate (Brief: Escalation Matrix) ──
  // Scan child-entered text for distress BEFORE any AI call. On a match,
  // freeze the session, log an escalation against the active child, and surface
  // a calm pause screen. Fail-safe: this runs first and short-circuits.
  if (studentAnswer) {
    const distress = checkDistress(studentAnswer);
    if (distress.matched) {
      try {
        const child = await getActiveChild(parentId, await readActiveChildId());
        if (child?._id) {
          await recordEscalation(child._id, {
            trigger: distress.trigger,
            severity: distress.severity,
            matchedText: studentAnswer,
            phrase: distress.phrase,
          });
          await notifyEscalation(parentId, child.full_name, distress.severity);
        }
      } catch (err) {
        console.error("[/api/tutor] escalation log failed (still freezing):", err);
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
  }

  // Entitlement AFTER the distress gate — a distress message from an unpaid
  // account must still freeze and escalate (the gate above costs nothing);
  // only the paid OpenAI explanation below is tier-gated.
  if (!(await parentCanUseAi(parentId))) {
    return NextResponse.json({ error: AI_ENTITLEMENT_ERROR }, { status: 403 });
  }

  // Rate limit AFTER the distress gate (a distress message must never be
  // blocked by a 429) but before the paid OpenAI call it exists to protect.
  const limited = await rateLimit(
    `tutor:${parentId}`,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  const keyStage =
    typeof body.keyStage === "number" && [2, 3, 4].includes(body.keyStage)
      ? body.keyStage
      : undefined;

  // B3 fix: keep `wasCorrect` genuinely optional end-to-end. Coercing a
  // missing value to `false` (as this used to do) told the Teaching Agent the
  // child had answered WRONG even on a fresh re-explanation with no answer
  // attempt at all (e.g. "Show me another way" on the Explainer) — pass
  // `undefined` through unchanged so that case gets its own framing.
  const req: TutorRequest = {
    prompt,
    correctAnswer,
    topic: asString(body.topic) || undefined,
    studentAnswer,
    wasCorrect: typeof body.wasCorrect === "boolean" ? body.wasCorrect : undefined,
    keyStage,
  };

  try {
    const result = await runTeachingAgent(req);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof AiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[/api/tutor] Teaching Agent failed:", err);
    return NextResponse.json(
      { error: "The Teaching Agent is temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}
