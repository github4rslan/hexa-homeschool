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
    title: "Diagnostic Assessment",
    timing: "Day 1",
    description:
      "A comprehensive 60-minute dynamic entry model mapped to standard examination specifications.",
    detail:
      "Establishes baseline competencies and identifies precise informational gaps using Item Response Theory.",
    icon: "Activity",
    agentIds: ["diagnostic"],
  },
  {
    step: 2,
    title: "Automated Curricular Planning",
    timing: "Week 1",
    description:
      "A programmatic, two-year macro-syllabus generated instantly and presented to parents.",
    detail:
      "Parents retain granular control or can structurally validate the AI's plan before lessons begin.",
    icon: "Map",
    agentIds: ["planning"],
  },
  {
    step: 3,
    title: "Iterative Daily Learning",
    timing: "Ongoing",
    description:
      "Micro-targeted instructional intervals lasting 45–60 minutes with multi-modal video, drilling and mastery.",
    detail:
      "The Teaching Agent dynamically modifies instructional approaches when friction is detected.",
    icon: "Sparkles",
    agentIds: ["teaching"],
  },
  {
    step: 4,
    title: "High-Fidelity Evaluation",
    timing: "Monthly",
    description:
      "Regular simulated examination cycles matching historical mock distributions.",
    detail:
      "Automatically parsed with associated grade estimations and regression risk analysis.",
    icon: "ClipboardCheck",
    agentIds: ["assessment"],
  },
  {
    step: 5,
    title: "Standardised Examination Entry",
    timing: "Age 14",
    description:
      "Direct routing strategies guiding parents through independent candidate entry configurations.",
    detail:
      "Across verified regional assessment nodes — Mathematics, English, Science.",
    icon: "GraduationCap",
    agentIds: ["planning", "compliance"],
  },
  {
    step: 6,
    title: "Compliance Portfolio Compilation",
    timing: "Ongoing",
    description:
      "Algorithmic log transformations compiled into authoritative progress dossiers.",
    detail:
      "Tailored for unprompted Local Authority presentation with SHA-256 verifiable signatures.",
    icon: "FileCheck",
    agentIds: ["compliance"],
  },
];
