import "server-only";
import {
  OPENAI_API_BASE,
  VISUAL_IMAGE_MODEL,
  getOpenAIKey,
} from "@/lib/ai/config";
import {
  buildVisualPrompt,
  type VisualPromptInput,
} from "@/lib/ai/visual-prompt";

export interface GeneratedVisual {
  bytes: ArrayBuffer;
  mimeType: "image/png";
  model: string;
  latencyMs: number;
  tokens: number;
}

/**
 * Generate one candidate educational visual. This output is UNTRUSTED and must
 * pass the Visual Checker before it is uploaded, cached, or returned to a child.
 */
export async function generateQuestionVisual(
  input: VisualPromptInput,
): Promise<GeneratedVisual> {
  const key = getOpenAIKey();
  const started = Date.now();
  const response = await fetch(`${OPENAI_API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISUAL_IMAGE_MODEL,
      prompt: buildVisualPrompt(input),
      size: "1536x1024",
      quality: "low",
      output_format: "png",
      n: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenAI image generation failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    data?: { b64_json?: string }[];
    usage?: { total_tokens?: number };
  };
  const base64 = data.data?.[0]?.b64_json;
  if (!base64) throw new Error("OpenAI image generation returned no image.");
  const buffer = Buffer.from(base64, "base64");

  return {
    bytes: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    mimeType: "image/png",
    model: VISUAL_IMAGE_MODEL,
    latencyMs: Date.now() - started,
    tokens: data.usage?.total_tokens ?? 0,
  };
}
