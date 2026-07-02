import { NextResponse } from "next/server";
import {
  AiConfigError,
  VISUAL_IMAGE_MODEL,
  VISUAL_CHECKER_MODEL,
} from "@/lib/ai/config";
import { generateQuestionVisual } from "@/lib/ai/visual-agent";
import { checkQuestionVisual } from "@/lib/ai/visual-checker";
import {
  cachedVisualIsServeable,
  questionVisualHash,
} from "@/lib/ai/visual-cache";
import { VISUAL_PROMPT_VERSION } from "@/lib/ai/visual-prompt";
import { aiVisualsEnabled } from "@/lib/ai/visual-flags";
import {
  currentParentId,
  findMediaByHash,
  flagQuestionVisuals,
  getQuestionById,
  logInvocation,
  recordMedia,
} from "@/lib/db/repo";
import { rateLimit } from "@/lib/rate-limit";
import {
  MediaConfigError,
  getCloudinaryConfig,
  uploadBytes,
} from "@/lib/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_REQUESTS = 12;
const RATE_LIMIT_WINDOW_MS = 60_000;

function noVisual(status = 200): NextResponse {
  return NextResponse.json(
    { visual: null },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function asKeyStage(value: unknown, fallback: number): number {
  return typeof value === "number" && [2, 3, 4].includes(value)
    ? value
    : fallback;
}

function cloudinaryAvailable(): boolean {
  try {
    getCloudinaryConfig();
    return true;
  } catch (err) {
    if (err instanceof MediaConfigError) return false;
    throw err;
  }
}

export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!aiVisualsEnabled()) return noVisual();

  let body: { questionId?: unknown; keyStage?: unknown };
  try {
    body = (await request.json()) as { questionId?: unknown; keyStage?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const questionId =
    typeof body.questionId === "string" ? body.questionId.trim() : "";
  if (!questionId) {
    return NextResponse.json(
      { error: "'questionId' is required." },
      { status: 400 },
    );
  }

  const question = await getQuestionById(questionId);
  if (!question?._id) return noVisual(404);

  const correctAnswer = question.options[question.correct_index] ?? "";
  const keyStage = asKeyStage(body.keyStage, question.key_stage ?? 4);
  const contentHash = questionVisualHash({
    questionId,
    prompt: question.prompt,
    correctAnswer,
    keyStage,
  });

  const cached = await findMediaByHash("question_visual", contentHash);
  if (cachedVisualIsServeable(cached)) {
    return NextResponse.json(
      {
        visual: {
          url: cached!.secure_url,
          alt: `Helpful visual for this ${question.subject} question.`,
        },
      },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  }

  if (!cloudinaryAvailable()) return noVisual();

  const limited = await rateLimit(
    `question-visual:${parentId}`,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!limited.ok) return noVisual();

  const visualInput = {
    prompt: question.prompt,
    correctAnswer,
    topic: question.topic_tag,
    keyStage,
  };

  try {
    const generated = await generateQuestionVisual(visualInput);
    const checker = await checkQuestionVisual(visualInput, generated.bytes);
    void logInvocation([
      {
        agent: "Visual",
        model: VISUAL_IMAGE_MODEL,
        tokens: generated.tokens,
        latencyMs: generated.latencyMs,
        blocked: !checker.passed,
        reason: checker.passed ? undefined : checker.reason,
      },
      {
        agent: "Visual Checker",
        model: VISUAL_CHECKER_MODEL,
        tokens: checker.tokens,
        latencyMs: checker.latencyMs,
        blocked: !checker.passed,
        reason: checker.passed ? undefined : checker.reason,
      },
    ]);

    if (!checker.passed) return noVisual();

    const upload = await uploadBytes({
      bytes: generated.bytes,
      useCase: "question_visual",
      resourceType: "image",
      authenticated: false,
      publicIdHint: contentHash.slice(0, 32),
      contentType: generated.mimeType,
      filename: "question-visual.png",
    });
    await recordMedia({
      owner_id: null,
      child_id: null,
      use_case: "question_visual",
      folder: "hexa/question-visuals",
      public_id: upload.publicId,
      secure_url: upload.secureUrl,
      resource_type: "image",
      is_public: true,
      content_hash: contentHash,
      meta: {
        checked: "true",
        flagged: "false",
        prompt_version: VISUAL_PROMPT_VERSION,
        question_id: questionId,
        confidence: String(checker.confidence),
      },
    });

    return NextResponse.json(
      {
        visual: {
          url: upload.secureUrl,
          alt: `Helpful visual for this ${question.subject} question.`,
        },
      },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  } catch (err) {
    if (err instanceof AiConfigError) return noVisual();
    console.error("[/api/question-visual] failed:", err);
    return noVisual();
  }
}

export async function DELETE(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { questionId?: unknown; reason?: unknown };
  try {
    body = (await request.json()) as { questionId?: unknown; reason?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const questionId =
    typeof body.questionId === "string" ? body.questionId.trim() : "";
  if (!questionId) {
    return NextResponse.json(
      { error: "'questionId' is required." },
      { status: 400 },
    );
  }

  // Flagging hides a SHARED, cross-family visual for everyone, so an ownership
  // check does not apply — the abuse is a single parent iterating question ids
  // to suppress visuals globally. Bound it with the same per-parent limit as the
  // POST; a genuine "this picture is wrong" report is well under the ceiling.
  const limited = await rateLimit(
    `question-visual-flag:${parentId}`,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { ok: true, flagged: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const question = await getQuestionById(questionId);
  if (!question?._id) {
    return NextResponse.json({ ok: true, flagged: 0 });
  }

  const flagged = await flagQuestionVisuals(
    questionId,
    typeof body.reason === "string" ? body.reason : "reported",
  );
  return NextResponse.json(
    { ok: true, flagged },
    { headers: { "Cache-Control": "no-store" } },
  );
}
