import { NextResponse } from "next/server";
import { runTeachingAgent, type TutorRequest } from "@/lib/ai/teaching-agent";
import { AiConfigError } from "@/lib/ai/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reject absurd payloads early — these are short tutoring prompts, not essays. */
const MAX_FIELD_LENGTH = 2000;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
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

  const req: TutorRequest = {
    prompt,
    correctAnswer,
    topic: asString(body.topic) || undefined,
    studentAnswer: asString(body.studentAnswer) || undefined,
    wasCorrect: body.wasCorrect === true,
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
