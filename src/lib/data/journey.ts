/**
 * The end-to-end student journey.
 * Source: HEXA Technical Brief v1.0, Section 1.
 */

export interface JourneyStep {
  step: number;
  title: string;
  timing: string;
  description: string;
  detail: string;
  icon: string; // lucide icon name
  agentIds: string[];
}

export const JOURNEY: JourneyStep[] = [
  {
    step: 1,
    title: "Understand",
    timing: "Day 1",
    description:
      "A 60-minute diagnostic maps your child's current level against GCSE standards. No guesswork. Just facts.",
    detail:
      "Establishes baseline competencies and identifies precise gaps using Item Response Theory.",
    icon: "Activity",
    agentIds: ["diagnostic"],
  },
  {
    step: 2,
    title: "Plan",
    timing: "Week 1",
    description:
      "A personalised two-year syllabus is built. You review, adjust, and approve. This is your roadmap.",
    detail:
      "Parents retain granular control and authorise the plan before any lessons begin.",
    icon: "Map",
    agentIds: ["planning"],
  },
  {
    step: 3,
    title: "Learn",
    timing: "Every day",
    description:
      "Daily lessons delivered: explainer video, adaptive practice, mastery check. AI adapts to how your child learns best.",
    detail:
      "The Teaching Agent dynamically modifies its approach when friction is detected — with a checker on every output.",
    icon: "Sparkles",
    agentIds: ["teaching"],
  },
  {
    step: 4,
    title: "Assess",
    timing: "Every month",
    description:
      "Mock exams under timed conditions. Grade predictions. Trend analysis. You see progress, not just activity.",
    detail:
      "Automatically parsed with grade estimations cross-referenced against historical UK national datasets.",
    icon: "ClipboardCheck",
    agentIds: ["assessment"],
  },
  {
    step: 5,
    title: "Prove",
    timing: "Every term",
    description:
      "One button generates your Local Authority portfolio. Verified. Professional. Ready to send.",
    detail:
      "Compiled into a tamper-evident PDF with an SHA-256 verifiable signature.",
    icon: "FileCheck",
    agentIds: ["compliance"],
  },
  {
    step: 6,
    title: "Decide",
    timing: "When ready",
    description:
      "When your child reaches the standard, you choose whether to sit the exam at 14, 15, or 16. HEXA supports you either way.",
    detail:
      "No artificial deadlines. The decision is data-driven and entirely yours.",
    icon: "GraduationCap",
    agentIds: ["planning", "assessment"],
  },
];
