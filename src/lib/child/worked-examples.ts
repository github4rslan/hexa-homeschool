export interface VisualAid {
  label: string;
  value: string;
}

export interface WorkedExampleStep {
  line: string;
  visual?: VisualAid | null;
}

export interface WorkedExample {
  title: string;
  scenario?: string;
  steps: WorkedExampleStep[];
  yourTurn?: string;
}

export function normalizeWorkedExample(value: unknown): WorkedExample | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const scenario = typeof raw.scenario === "string" ? raw.scenario.trim() : "";
  const yourTurn = typeof raw.yourTurn === "string" ? raw.yourTurn.trim() : "";
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = stepsRaw
    .map((step): WorkedExampleStep | null => {
      if (!step || typeof step !== "object") return null;
      const s = step as Record<string, unknown>;
      const line = typeof s.line === "string" ? s.line.trim() : "";
      if (!line) return null;
      const v = s.visual;
      let visual: VisualAid | null = null;
      if (v && typeof v === "object") {
        const visualRaw = v as Record<string, unknown>;
        const label =
          typeof visualRaw.label === "string" ? visualRaw.label.trim() : "";
        const visualValue =
          typeof visualRaw.value === "string" ? visualRaw.value.trim() : "";
        if (label && visualValue) visual = { label, value: visualValue };
      }
      return { line, visual };
    })
    .filter((step): step is WorkedExampleStep => step !== null);

  if (!title || steps.length === 0) return undefined;
  return {
    title,
    ...(scenario ? { scenario } : {}),
    steps,
    ...(yourTurn ? { yourTurn } : {}),
  };
}

export function workedExampleNarration(input: WorkedExample): string[] {
  return input.steps.map((step, index) => {
    const intro = index === 0 && input.scenario ? `${input.scenario}. ` : "";
    return `${intro}Step ${index + 1}. ${step.line}`;
  });
}

export function visibleWorkedStepCount(input: {
  currentStep: number;
  totalSteps: number;
  reducedMotion: boolean;
}): number {
  if (input.totalSteps <= 0) return 0;
  if (input.reducedMotion) return input.totalSteps;
  return Math.min(Math.max(input.currentStep + 1, 1), input.totalSteps);
}
