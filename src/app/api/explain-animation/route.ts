import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  runAnimationAgent,
  type TutorRequest,
} from "@/lib/ai/teaching-agent";
import { AiConfigError, TEACHING_MODEL } from "@/lib/ai/config";
import {
  validateTeachingAnimation,
  type TeachingAnimationType,
} from "@/lib/child/teaching-animations";
import { checkDistress } from "@/lib/safety/escalation";
import {
  currentParentId,
  findCachedAnimation,
  getActiveChild,
  recordEscalation,
  saveCachedAnimation,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { rateLimit } from "@/lib/rate-limit";
import { parentCanUseAi, AI_ENTITLEMENT_ERROR } from "@/lib/billing/entitlement";
import { notifyEscalation } from "@/lib/email/escalation-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Agentic "Explain it my way" (Wave 8, Phase 2).
 *
 * Returns a student-tailored explanation AS a TeachingAnimation so it renders
 * through the same safe animated pipeline. Mirrors `/api/tutor`'s ordering
 * exactly: distress gate FIRST (child-safety rule 2), then the tier gate, then
 * the rate limit, then the paid model call. The Checker gates every word; only
 * VERIFIED animations are cached (per question+band) or returned — a null
 * animation tells the client to keep the deterministic version. No raw model
 * output ever reaches a child.
 */

const MAX_FIELD_LENGTH = 2000;

/** Tighter than /api/tutor — this is a two-model-call enrichment, not core help. */
const RATE_LIMIT_REQUESTS = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Bump to invalidate cached animations when the generation prompt changes. */
const PROMPT_VERSION = "v1";

const ANIMATION_TYPES: TeachingAnimationType[] = [
  "equation_steps",
  "choice_strategy",
  "grammar_highlight",
  "science_sequence",
];

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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = asString(body.prompt);
  const correctAnswer = asString(body.correctAnswer);
  if (!prompt || !correctAnswer) {
    return NextResponse.json(
      { error: "Both 'prompt' and 'correctAnswer' are required." },
      { status: 400 },
    );
  }
  if (
    prompt.length > MAX_FIELD_LENGTH ||
    correctAnswer.length > MAX_FIELD_LENGTH
  ) {
    return NextResponse.json(
      { error: "Input exceeds maximum length." },
      { status: 413 },
    );
  }

  const studentAnswer = asString(body.studentAnswer) || undefined;

  // ── Safety gate — BEFORE any AI call, exactly like /api/tutor. ──
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
        console.error(
          "[/api/explain-animation] escalation log failed (still freezing):",
          err,
        );
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

  // Tier gate AFTER the distress gate; rate limit before the paid call.
  if (!(await parentCanUseAi(parentId))) {
    return NextResponse.json({ error: AI_ENTITLEMENT_ERROR }, { status: 403 });
  }

  const keyStage =
    typeof body.keyStage === "number" && [2, 3, 4].includes(body.keyStage)
      ? body.keyStage
      : undefined;
  const animationType: TeachingAnimationType = ANIMATION_TYPES.includes(
    body.animationType as TeachingAnimationType,
  )
    ? (body.animationType as TeachingAnimationType)
    : "choice_strategy";

  // Cache key: question + canonical answer + band + prompt version. The child's
  // exact wrong answer is deliberately NOT in the key (explanations stay
  // per-question, cost stays bounded) and never enters the cache.
  const contentHash = createHash("sha256")
    .update(
      `${PROMPT_VERSION}:${animationType}:${keyStage ?? "na"}:${prompt}:${correctAnswer}`,
    )
    .digest("hex");

  // 1) Cache hit → a previously Checker-PASSED animation (re-validated on the
  //    way out so a corrupted row can never render).
  try {
    const cached = await findCachedAnimation(contentHash);
    if (cached) {
      const animation = validateTeachingAnimation(cached.animation);
      if (animation) {
        return NextResponse.json(
          { animation, aiVerified: true, cached: true },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
    }
  } catch (err) {
    console.error(
      "[/api/explain-animation] cache lookup failed (continuing):",
      err,
    );
  }

  const limited = await rateLimit(
    `explain-anim:${parentId}`,
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

  const req: TutorRequest = {
    prompt,
    correctAnswer,
    topic: asString(body.topic) || undefined,
    studentAnswer,
    wasCorrect: false,
    keyStage,
  };

  try {
    const result = await runAnimationAgent(req, animationType);

    // 2) Only VERIFIED animations are cached — the cache can never replay an
    //    unchecked output. Best-effort; a cache write failure never blocks.
    if (result.aiVerified && result.animation) {
      const animation = result.animation;
      void saveCachedAnimation({
        content_hash: contentHash,
        animation: animation as unknown as Record<string, unknown>,
        key_stage: keyStage,
        model: TEACHING_MODEL,
      }).catch((err) =>
        console.error(
          "[/api/explain-animation] cache store failed (ignored):",
          err,
        ),
      );
    }

    return NextResponse.json(
      {
        animation: result.animation,
        aiVerified: result.aiVerified,
        cached: false,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[/api/explain-animation] Animation Agent failed:", err);
    return NextResponse.json(
      { error: "Tailored explanations are temporarily unavailable." },
      { status: 502 },
    );
  }
}
