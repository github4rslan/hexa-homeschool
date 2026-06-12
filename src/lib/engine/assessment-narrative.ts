/**
 * "Understanding these results" — plain-English assessment narrative.
 *
 * Deterministic template text built from real evaluation data. This is NOT an
 * AI surface: no OpenAI call, no new costs, nothing to checker-gate. Pure so
 * it runs in both the client diagnostic results view and server pages.
 * Parent-facing tone: honest, encouraging, no jargon.
 */

export type NarrativeSubject = "mathematics" | "english" | "science";

const LABEL: Record<NarrativeSubject, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

export interface SubjectNarrativeInput {
  subject: NarrativeSubject;
  /** 0–100 readiness (the stored raw_score), or null if never assessed. */
  readiness: number | null;
  /** Predicted GCSE grade — a number like "5" or a band like "Grade 4–5". */
  grade: string | null;
}

export interface SubjectNarrative {
  subject: NarrativeSubject;
  label: string;
  text: string;
}

export interface AssessmentNarrative {
  /** The short-assessment / confidence caveat, shown once above the subjects. */
  intro: string;
  subjects: SubjectNarrative[];
  /** One sentence connecting the results to this week's plan. */
  planNote: string;
}

/** Last digit in a grade string: "5" → 5, "Grade 4–5" → 5, "A" → null. */
function gradeNumber(grade: string): number | null {
  const digits = grade.match(/\d/g);
  return digits ? parseInt(digits[digits.length - 1], 10) : null;
}

function gradeSentence(grade: string, label: string): string {
  const n = gradeNumber(grade);
  const shown = /grade/i.test(grade) ? grade : `grade ${grade}`;
  const lead = `${label} is working at ${shown} today.`;
  if (n === null) return lead;
  if (n >= 7) {
    return `${lead} GCSEs are graded 1–9, so that sits in the top band (7–9) — well beyond the grade 4 standard pass.`;
  }
  if (n >= 5) {
    return `${lead} On the 1–9 GCSE scale that is already past the grade 4 standard pass and at the grade 5 "strong pass" — a solid position to build from.`;
  }
  if (n === 4) {
    return `${lead} Grade 4 is the GCSE standard pass, so they are right at pass level with plenty of runway to climb.`;
  }
  return `${lead} That is below the grade 4 standard pass for now — which only tells the plan where to start, not where it ends.`;
}

function readinessSentence(readiness: number): string {
  const r = Math.round(readiness);
  if (r >= 70) {
    return `A readiness of ${r}% means they answered confidently at this level — close to exam-secure on the topics tested.`;
  }
  if (r >= 40) {
    return `A readiness of ${r}% means they are secure in places with clear gaps to close — exactly what the weekly plan targets.`;
  }
  return `A readiness of ${r}% says this level is still new ground, so lessons start with the foundations and build up step by step.`;
}

/**
 * Build the narrative. `planCounts` (sessions per subject on this week's
 * schedule) grounds the plan sentence in the real plan; pass null/undefined
 * when no schedule exists yet and a forward-looking line is used instead.
 */
export function buildAssessmentNarrative(
  standings: SubjectNarrativeInput[],
  planCounts?: Partial<Record<NarrativeSubject, number>> | null,
): AssessmentNarrative {
  const intro =
    "These results come from a short adaptive assessment, so treat them as a confident starting point rather than a verdict — the picture sharpens as real lesson evidence builds up.";

  const subjects: SubjectNarrative[] = standings.map((s) => {
    const label = LABEL[s.subject];
    if (s.readiness === null && !s.grade) {
      return {
        subject: s.subject,
        label,
        text: `${label} has not been assessed yet — the diagnostic takes about five minutes and gives the plan a real baseline to work from.`,
      };
    }
    const parts: string[] = [];
    if (s.grade) parts.push(gradeSentence(s.grade, label));
    if (s.readiness !== null) parts.push(readinessSentence(s.readiness));
    return { subject: s.subject, label, text: parts.join(" ") };
  });

  let planNote =
    "The Planning Agent turns this baseline into the weekly plan: every session targets the next uncertified topic, so the subjects with the most ground to cover get the most time.";
  if (planCounts) {
    const counted = (Object.keys(LABEL) as NarrativeSubject[])
      .map((subj) => ({ label: LABEL[subj], count: planCounts[subj] ?? 0 }))
      .filter((c) => c.count > 0);
    if (counted.length > 0) {
      const summary = counted
        .map((c) => `${c.count} ${c.label}`)
        .join(", ")
        .replace(/, ([^,]*)$/, " and $1");
      const repeated = counted.filter((c) => c.count > 1).map((c) => c.label);
      planNote =
        `This baseline is why this week's plan has ${summary} session${counted.some((c) => c.count > 1) || counted.length > 1 ? "s" : ""}` +
        (repeated.length > 0
          ? ` — ${repeated.join(" and ")} appear${repeated.length === 1 ? "s" : ""} more than once because that is where the next uncertified topics are.`
          : ", each targeting the next uncertified topic.");
    }
  }

  return { intro, subjects, planNote };
}
