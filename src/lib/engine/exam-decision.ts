/**
 * Exam Decision Engine (Brief: "The Exam Decision Paradigm").
 *
 * Pure, deterministic. At age 13+ and based on real per-subject readiness, it
 * presents clear data-driven Paths (A–D) — never an age-based deadline. This
 * encodes the brief's core philosophy: shift pressure away from age milestones;
 * the parent decides, the data informs.
 */

import type { Subject } from "@/lib/db/types";

export interface SubjectInput {
  subject: Subject;
  readiness: number | null; // 0–100
  grade: string | null;
}

export interface ExamPath {
  key: "A" | "B" | "C" | "D";
  title: string;
  detail: string;
  recommended: boolean;
}

export interface ExamDecision {
  eligible: boolean; // age 13+ with at least one assessed subject
  age: number;
  focusSubject: Subject | null;
  readiness: number | null;
  grade: string | null;
  paths: ExamPath[];
  /** One-line plain summary for the card header. */
  summary: string;
}

export function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

const SUBJECT_LABEL: Record<Subject, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

/**
 * Compute the decision for a child. `focus` is the HIGHEST-readiness assessed
 * subject — the "ready to sit" anchor for the framing; paths reflect it.
 */
export function computeExamDecision(
  dob: string,
  subjects: SubjectInput[],
): ExamDecision {
  const age = ageFromDob(dob);
  const assessed = subjects.filter((s) => s.readiness !== null);

  if (age < 13 || assessed.length === 0) {
    return {
      eligible: false,
      age,
      focusSubject: null,
      readiness: null,
      grade: null,
      paths: [],
      summary:
        age < 13
          ? "Exam-path options appear from age 13, based on real readiness."
          : "Run the diagnostic to unlock data-driven exam-path options.",
    };
  }

  // Focus on the strongest subject for the "ready to sit" framing, but surface
  // the lowest as the area needing more time. Use highest readiness as anchor.
  const sorted = [...assessed].sort(
    (a, b) => (b.readiness ?? 0) - (a.readiness ?? 0),
  );
  const focus = sorted[0];
  const readiness = focus.readiness ?? 0;
  const label = SUBJECT_LABEL[focus.subject];

  const paths: ExamPath[] = [
    {
      key: "A",
      title: `Advance the ${label} curriculum`,
      detail: "Continue building depth for a higher grade. Target a later sitting when fully ready.",
      recommended: readiness >= 50 && readiness < 75,
    },
    {
      key: "B",
      title: "Sit Foundation tier when ready",
      detail: "Secure a safe Grade 4–5 outcome once readiness holds above 75%.",
      recommended: readiness >= 75,
    },
    {
      key: "C",
      title: "Push for Higher tier",
      detail: "Aim for Grade 6+ with a few more months of focused practice.",
      recommended: readiness >= 85,
    },
    {
      key: "D",
      title: "Strengthen foundations first",
      detail: "Spend more time on core topics before choosing an exam route.",
      recommended: readiness < 50,
    },
  ];

  return {
    eligible: true,
    age,
    focusSubject: focus.subject,
    readiness,
    grade: focus.grade,
    paths,
    summary: `Working at ${focus.grade ? `Grade ${focus.grade}` : "an early level"} in ${label} · ${Math.round(readiness)}% exam readiness.`,
  };
}
