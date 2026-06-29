/**
 * The Edway implementation roadmap.
 * Source: Edway Technical Brief v1.0, Section 7.
 */

export type PhaseStatus = "complete" | "in_progress" | "upcoming";

export interface Phase {
  id: string;
  number: string;
  name: string;
  window: string;
  status: PhaseStatus;
  objective: string;
  deliverables: string[];
  excluded?: string[];
  team: string[];
  cap: string;
  target?: string;
}

export const ROADMAP: Phase[] = [
  {
    id: "phase-1",
    number: "01",
    name: "Foundation",
    window: "Months 1–4",
    status: "in_progress",
    objective:
      "Deploy a minimal functional loop verified via a small internal trial cohort to confirm underlying software paths.",
    deliverables: [
      "Responsive parent portal in Next.js",
      "Core lesson delivery screens",
      "Fixed rule-based adaptive pathways",
      "Hardcoded lesson frameworks (no AI yet)",
      "PostgreSQL relational database",
    ],
    excluded: [
      "Synthetic video workflows",
      "Automated portfolio engines",
      "Tutor marketplace",
      "Native mobile apps",
    ],
    team: [
      "2 Full-Stack Engineers",
      "1 Curricular Specialist",
    ],
    cap: "£50,000",
    target: "Internal trial cohort",
  },
  {
    id: "phase-2",
    number: "02",
    name: "Core Platform Integration",
    window: "Months 5–8",
    status: "upcoming",
    objective:
      "Launch paid public trials targeting initial monetisation cohorts.",
    deliverables: [
      "RAG workflows in Teaching Agent",
      "GPT-4 long-form grading in Assessment Agent",
      "Automated compliance portfolio generation",
      "ElevenLabs voice synthesis pipelines",
      "Static visual templates for lessons",
    ],
    team: [
      "+ 1 Interface Engineer",
      "+ 1 AI Specialist",
      "+ 2 Curriculum Reviewers",
    ],
    cap: "£150,000",
    target: "100 paying subscriptions",
  },
  {
    id: "phase-3",
    number: "03",
    name: "Scale & Monitoring",
    window: "Months 9–14",
    status: "upcoming",
    objective:
      "Scale active subscriptions while deploying full infrastructure monitoring patterns.",
    deliverables: [
      "Native React Native iOS + Android apps",
      "Full Checker architecture deployment",
      "Meta Checker supervision layer",
      "Read-only LA verification portals",
      "Additional curriculum paths",
    ],
    team: [
      "+ 1 Mobile Developer",
      "+ 1 SecOps Specialist",
      "+ 1 Support Lead",
    ],
    cap: "£300,000",
    target: "500 paying subscriptions",
  },
  {
    id: "phase-4",
    number: "04",
    name: "Optimisation & Maturity",
    window: "Months 15–24",
    status: "upcoming",
    objective:
      "Scale the business toward strategic enterprise metrics and exit maturity.",
    deliverables: [
      "Full agent automation targets",
      "Direct examination node integrations",
      "Predictive national grade distributions",
      "Enterprise analytics suite",
    ],
    team: ["Mature multi-disciplinary team"],
    cap: "Scaled",
    target: "£2.5M+ ARR · 85%+ retention",
  },
];
