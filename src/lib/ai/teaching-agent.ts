/**
 * Teaching Agent + Teaching Checker (bounded Phase-1 implementation).
 *
 * Pipeline (per Edway Technical Brief v2.0, Agent 2):
 *   1. Teaching Agent generates a contextual explanation grounded in the
 *      human-authored question + canonical answer (the "vetted matrix").
 *   2. Teaching Checker independently validates that explanation for factual
 *      accuracy against the canonical answer and for tone (zero condescension).
 *   3. If checker confidence < 95%, the whole block is REJECTED and a
 *      human-authored fallback explanation is served instead.
 *
 * No model output reaches the child until the checker has passed it.
 */

import {
  OPENAI_API_BASE,
  TEACHING_MODEL,
  TEACHING_CONFIDENCE_THRESHOLD,
  getOpenAIKey,
} from "./config";
import { logInvocation } from "@/lib/db/repo";
import {
  animationCheckerText,
  validateTeachingAnimation,
  type TeachingAnimation,
  type TeachingAnimationType,
} from "@/lib/child/teaching-animations";

export interface TutorRequest {
  /** The question prompt shown to the student (human-authored). */
  prompt: string;
  /** The canonical correct answer (human-authored ground truth). */
  correctAnswer: string;
  /** Topic context, e.g. "Algebra · Linear equations". */
  topic?: string;
  /** Optional: the answer the student gave, to tailor the explanation. */
  studentAnswer?: string;
  /** Whether the student got it right (changes encouragement framing). */
  wasCorrect?: boolean;
  /**
   * Optional UK key-stage band (2/3/4) — TONE GUIDANCE ONLY, so the reading
   * level matches a younger child. The Checker still gates every output; this
   * never bypasses validation or changes the canonical answer.
   */
  keyStage?: number;
}

/** Reading-level guidance for the Teaching Agent prompt (tone only). */
function readingLevelGuidance(keyStage?: number): string | null {
  switch (keyStage) {
    case 2:
      return "Reading level: a primary-school child (ages 7–10). Use very simple, concrete words, one idea per short sentence, and explain the action step by step.";
    case 3:
      return "Reading level: a lower-secondary child (ages 11–13). Keep it clear and straightforward.";
    default:
      return null; // KS4 / unset → standard GCSE register
  }
}

export interface CheckerResult {
  confidence: number;
  factuallyConsistent: boolean;
  toneAppropriate: boolean;
  reason: string;
}

export interface TutorResult {
  explanation: string;
  /** True when the AI explanation passed the checker and is being served. */
  aiVerified: boolean;
  /** True when we fell back to human-authored content (checker rejected AI). */
  usedFallback: boolean;
  checker: CheckerResult;
  model: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Provider response plus the telemetry we record per invocation. */
interface ChatResult {
  content: string;
  tokens: number;
  latencyMs: number;
}

async function chat(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; json?: boolean } = {},
): Promise<ChatResult> {
  const key = getOpenAIKey();
  const start = Date.now();
  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEACHING_MODEL,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 320,
      ...(options.json
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  });
  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI returned an empty response.");
  return { content, tokens: data.usage?.total_tokens ?? 0, latencyMs };
}

/**
 * B2 fix: the explanation system prompt, extracted so it's unit-testable.
 * Nothing here renders in `(child)` routes without the Checker gate below;
 * this is only the AGENT's instruction, not model output.
 */
export function explanationSystemPrompt(): string {
  return [
    "You are Edway's Teaching Agent — a UK GCSE tutor for a home-educated child.",
    "Explain in clear, encouraging, age-appropriate British English.",
    "Be concise: 2–4 short sentences. Never condescend. Never shame.",
    "Ground every statement in the provided correct answer. Do not introduce facts beyond it.",
    "Use UK spelling and GCSE conventions.",
    'Never use LaTeX or markup delimiters (no "\\(", "\\)", "\\[", "\\]", "$", "$$", "\\times", "\\frac", etc.). There is no maths-rendering pipeline downstream, so write any maths in plain text using normal symbols (×, ÷, ², √, ±).',
  ].join(" ");
}

/** Step 1 — generate the explanation, grounded in the canonical answer. */
async function generateExplanation(req: TutorRequest): Promise<ChatResult> {
  const framing = req.wasCorrect
    ? "The student answered correctly. Affirm briefly, then reinforce WHY it is correct."
    : "The student answered incorrectly or is stuck. Gently explain the correct method without shaming.";

  const system = explanationSystemPrompt();

  const user = [
    req.topic ? `Topic: ${req.topic}` : null,
    `Question: ${req.prompt}`,
    `Correct answer: ${req.correctAnswer}`,
    req.studentAnswer ? `Student's answer: ${req.studentAnswer}` : null,
    readingLevelGuidance(req.keyStage),
    framing,
  ]
    .filter(Boolean)
    .join("\n");

  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.5, maxTokens: 220 },
  );
}

/** Checker outcome plus the telemetry of the checker's own model call. */
interface CheckerRun {
  result: CheckerResult;
  tokens: number;
  latencyMs: number;
}

/** Step 2 — independent checker validates the explanation. */
async function runChecker(
  req: TutorRequest,
  explanation: string,
): Promise<CheckerRun> {
  const system = [
    "You are Edway's Teaching Checker — an independent safety validator.",
    "You verify a tutor explanation BEFORE it reaches a child.",
    "Check two things strictly:",
    "1) Factual consistency: does the explanation agree with the canonical correct answer and contain no incorrect mathematical/scientific/grammatical claims?",
    "2) Tone: is it free of condescension, shaming, or anything inappropriate for a child, and does it match the requested reading level?",
    "Respond ONLY with JSON: {\"confidence\": number 0-1, \"factuallyConsistent\": boolean, \"toneAppropriate\": boolean, \"reason\": string}.",
    "confidence reflects your certainty the explanation is safe AND correct.",
  ].join(" ");

  const user = [
    req.topic ? `Topic: ${req.topic}` : null,
    `Question: ${req.prompt}`,
    `Canonical correct answer: ${req.correctAnswer}`,
    readingLevelGuidance(req.keyStage),
    `Tutor explanation to validate: "${explanation}"`,
  ]
    .filter(Boolean)
    .join("\n");

  const { content: raw, tokens, latencyMs } = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0, maxTokens: 200, json: true },
  );

  let parsed: Partial<CheckerResult>;
  try {
    parsed = JSON.parse(raw) as Partial<CheckerResult>;
  } catch {
    // A checker we can't parse is a checker we don't trust → fail closed.
    return {
      result: {
        confidence: 0,
        factuallyConsistent: false,
        toneAppropriate: false,
        reason:
          "Checker response could not be parsed; failing closed for safety.",
      },
      tokens,
      latencyMs,
    };
  }

  return {
    result: {
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0,
      factuallyConsistent: parsed.factuallyConsistent === true,
      toneAppropriate: parsed.toneAppropriate === true,
      reason:
        typeof parsed.reason === "string"
          ? parsed.reason
          : "No reason supplied.",
    },
    tokens,
    latencyMs,
  };
}

/** Human-authored fallback — served when the AI explanation is rejected. */
function fallbackExplanation(req: TutorRequest): string {
  const lead = req.wasCorrect
    ? "Correct. "
    : "Not quite — here's the worked answer. ";
  return `${lead}The correct answer is ${req.correctAnswer}. Review the method step by step and try a similar question to lock it in. If it still doesn't click, a human tutor can help.`;
}

// ── Agentic "Explain it my way" (Wave 8, Phase 2) ────────────
//
// The Teaching Agent can also produce a student-tailored explanation AS a
// TeachingAnimation, so it renders through the same safe animated pipeline.
// Gate order (all must pass, else animation: null and the caller keeps the
// deterministic version): shape validation (`validateTeachingAnimation`) →
// the SAME independent Teaching Checker over every word
// (`animationCheckerText`) at the same 95% threshold. No raw model output
// ever reaches a child.

export interface AnimationAgentResult {
  /** The validated, Checker-passed animation — or null (use deterministic). */
  animation: TeachingAnimation | null;
  aiVerified: boolean;
  checker: CheckerResult;
  model: string;
}

/** Step 1 — generate a tailored animation payload (strict JSON). */
async function generateAnimation(
  req: TutorRequest,
  animationType: TeachingAnimationType,
): Promise<ChatResult> {
  const system = [
    "You are Edway's Teaching Agent, creating a SHORT animated mini-lesson for a home-educated child, tailored to how this student answered.",
    "Respond ONLY with JSON of this exact shape:",
    '{"type": string, "title": string, "intro": string, "coachLine": string, "steps": [{"label": string, "expression": string, "note": string, "focus": string}]}',
    `"type" MUST be "${animationType}". 3 to 5 steps.`,
    'Math syntax inside "expression"/"focus": use ^2 for squared, sqrt(9) for roots, +/- for plus-or-minus, plain ASCII only. Keep each expression under 40 characters.',
    '"label" is 1-3 words; "note" is ONE short warm sentence (under 140 characters); "focus" is the single token to highlight (may be "").',
    '"title"/"intro"/"coachLine" are short, warm, second-person, encouraging British English for a child — never condescending, never shaming.',
    "Ground everything in the provided correct answer. Do not introduce facts beyond it. The final step must state the correct answer.",
  ].join(" ");

  const user = [
    req.topic ? `Topic: ${req.topic}` : null,
    `Question: ${req.prompt}`,
    `Correct answer: ${req.correctAnswer}`,
    req.studentAnswer
      ? `Student's answer (tailor the explanation to the mistake): ${req.studentAnswer}`
      : null,
    readingLevelGuidance(req.keyStage),
  ]
    .filter(Boolean)
    .join("\n");

  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.5, maxTokens: 550, json: true },
  );
}

/** Shape-rejection checker verdict (fail closed, no second model call needed). */
const SHAPE_REJECTED: CheckerResult = {
  confidence: 0,
  factuallyConsistent: false,
  toneAppropriate: false,
  reason: "Animation payload failed shape validation; failing closed.",
};

/**
 * Full agentic-animation run: generate → validate shape → independent
 * Checker over every word → gate. Returns `animation: null` on ANY failure —
 * the caller always has the deterministic animation to fall back on, so this
 * never throws on rejection (only on config/network errors, which the route
 * maps to 503/502).
 */
export async function runAnimationAgent(
  req: TutorRequest,
  animationType: TeachingAnimationType,
): Promise<AnimationAgentResult> {
  const gen = await generateAnimation(req, animationType);

  let animation: TeachingAnimation | null = null;
  try {
    animation = validateTeachingAnimation(JSON.parse(gen.content));
  } catch {
    animation = null;
  }

  if (!animation) {
    void logInvocation([
      {
        agent: "Animation Agent",
        model: TEACHING_MODEL,
        tokens: gen.tokens,
        latencyMs: gen.latencyMs,
        blocked: true,
        reason: SHAPE_REJECTED.reason,
      },
    ]);
    return {
      animation: null,
      aiVerified: false,
      checker: SHAPE_REJECTED,
      model: TEACHING_MODEL,
    };
  }

  // The SAME independent Checker gates every word of the animation.
  const check = await runChecker(req, animationCheckerText(animation));
  const checker = check.result;
  const passed =
    checker.confidence >= TEACHING_CONFIDENCE_THRESHOLD &&
    checker.factuallyConsistent &&
    checker.toneAppropriate;

  void logInvocation([
    {
      agent: "Animation Agent",
      model: TEACHING_MODEL,
      tokens: gen.tokens,
      latencyMs: gen.latencyMs,
      blocked: !passed,
      reason: passed ? undefined : checker.reason,
    },
    {
      agent: "Meta Checker",
      model: TEACHING_MODEL,
      tokens: check.tokens,
      latencyMs: check.latencyMs,
      blocked: !passed,
      reason: passed ? undefined : checker.reason,
    },
  ]);

  return {
    animation: passed ? animation : null,
    aiVerified: passed,
    checker,
    model: TEACHING_MODEL,
  };
}

/**
 * Full Teaching Agent run: generate → check → gate.
 * Always returns serveable content; never throws on a checker rejection.
 */
export async function runTeachingAgent(
  req: TutorRequest,
): Promise<TutorResult> {
  const gen = await generateExplanation(req);
  const check = await runChecker(req, gen.content);
  const checker = check.result;

  const passed =
    checker.confidence >= TEACHING_CONFIDENCE_THRESHOLD &&
    checker.factuallyConsistent &&
    checker.toneAppropriate;

  // Record real telemetry for both model calls (best-effort, never throws).
  // The Teaching call is "blocked" when the checker ultimately rejected it.
  void logInvocation([
    {
      agent: "Teaching",
      model: TEACHING_MODEL,
      tokens: gen.tokens,
      latencyMs: gen.latencyMs,
      blocked: !passed,
      reason: passed ? undefined : checker.reason,
    },
    {
      agent: "Meta Checker",
      model: TEACHING_MODEL,
      tokens: check.tokens,
      latencyMs: check.latencyMs,
      // The checker itself succeeds whenever it returns a verdict; "blocked"
      // here marks that its verdict was a rejection of the Teaching output.
      blocked: !passed,
      reason: passed ? undefined : checker.reason,
    },
  ]);

  if (passed) {
    return {
      explanation: gen.content,
      aiVerified: true,
      usedFallback: false,
      checker,
      model: TEACHING_MODEL,
    };
  }

  // Checker rejected the AI output → serve human-authored fallback.
  return {
    explanation: fallbackExplanation(req),
    aiVerified: false,
    usedFallback: true,
    checker,
    model: TEACHING_MODEL,
  };
}
