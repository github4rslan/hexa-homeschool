import "server-only";
import {
  OPENAI_API_BASE,
  VISUAL_CHECKER_CONFIDENCE_THRESHOLD,
  VISUAL_CHECKER_MODEL,
  getOpenAIKey,
} from "@/lib/ai/config";
import type { VisualPromptInput } from "@/lib/ai/visual-prompt";

export interface VisualCheckerResult {
  passed: boolean;
  confidence: number;
  reason: string;
  tokens: number;
  latencyMs: number;
  moderationFlagged: boolean;
}

interface CheckerJson {
  confidence?: number;
  relevant?: boolean;
  safe?: boolean;
  noTextOrNumbers?: boolean;
  notMisleading?: boolean;
  reason?: string;
}

function dataUrl(bytes: ArrayBuffer): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}

async function moderateImage(bytes: ArrayBuffer): Promise<boolean> {
  const key = getOpenAIKey();
  const response = await fetch(`${OPENAI_API_BASE}/moderations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: { url: dataUrl(bytes) },
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenAI image moderation failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }
  const data = (await response.json()) as { results?: { flagged?: boolean }[] };
  return data.results?.some((result) => result.flagged === true) === true;
}

async function relevanceCheck(
  input: VisualPromptInput,
  bytes: ArrayBuffer,
): Promise<Omit<VisualCheckerResult, "moderationFlagged">> {
  const key = getOpenAIKey();
  const started = Date.now();
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISUAL_CHECKER_MODEL,
      temperature: 0,
      max_tokens: 180,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are Edway's automated Visual Checker.",
            "A child will see the image only if you approve it.",
            "Reject unless it is a clean, safe, age-appropriate educational diagram that matches the question concept.",
            "Reject if it contains text, letters, numerals, equations, labels, people, faces, misleading diagrams, or unsafe content.",
            "Respond only as JSON: {\"confidence\":0-1,\"relevant\":boolean,\"safe\":boolean,\"noTextOrNumbers\":boolean,\"notMisleading\":boolean,\"reason\":\"short\"}.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                `Question: ${input.prompt}`,
                `Correct answer: ${input.correctAnswer}`,
                `Topic: ${input.topic}`,
                `Key stage: ${input.keyStage}`,
              ].join("\n"),
            },
            {
              type: "image_url",
              image_url: { url: dataUrl(bytes) },
            },
          ],
        },
      ],
    }),
  });
  const latencyMs = Date.now() - started;

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenAI visual relevance check failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };
  const raw = payload.choices?.[0]?.message?.content ?? "{}";
  let parsed: CheckerJson = {};
  try {
    parsed = JSON.parse(raw) as CheckerJson;
  } catch {
    parsed = { reason: "Checker JSON could not be parsed." };
  }

  const confidence =
    typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0;
  const passed =
    confidence >= VISUAL_CHECKER_CONFIDENCE_THRESHOLD &&
    parsed.relevant === true &&
    parsed.safe === true &&
    parsed.noTextOrNumbers === true &&
    parsed.notMisleading === true;

  return {
    passed,
    confidence,
    reason: parsed.reason || "Visual Checker did not provide a reason.",
    tokens: payload.usage?.total_tokens ?? 0,
    latencyMs,
  };
}

export async function checkQuestionVisual(
  input: VisualPromptInput,
  bytes: ArrayBuffer,
): Promise<VisualCheckerResult> {
  const started = Date.now();
  const moderationFlagged = await moderateImage(bytes);
  if (moderationFlagged) {
    return {
      passed: false,
      confidence: 0,
      reason: "Image moderation flagged the generated visual.",
      tokens: 0,
      latencyMs: Date.now() - started,
      moderationFlagged,
    };
  }

  const relevance = await relevanceCheck(input, bytes);
  return { ...relevance, moderationFlagged };
}
