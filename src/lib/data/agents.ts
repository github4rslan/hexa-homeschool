/**
 * The six Edway AI agents.
 * Source of truth: Edway Technical Brief v2.0, "Agent Infrastructure Specifications".
 * Plain summaries: Edway Web Content, "The AI System".
 */

export type AgentId =
  | "diagnostic"
  | "teaching"
  | "assessment"
  | "planning"
  | "compliance"
  | "meta";

export interface Agent {
  id: AgentId;
  number: string;
  name: string;
  shortName: string;
  tagline: string;
  /** Plain-English, parent-facing one-liner (source: Edway Web Content). */
  plainSummary: string;
  purpose: string;
  ingests: string[];
  logic: string;
  deliverables?: string[];
  checker: {
    name: string;
    role: string;
  };
  tech: string[];
  color: "violet" | "neon" | "cyan" | "amber" | "crimson" | "fog";
  angle: number; // position on the constellation (degrees)
}

export const AGENTS: Agent[] = [
  {
    id: "diagnostic",
    number: "01",
    name: "Diagnostic Agent",
    shortName: "Diagnostic",
    tagline: "Maps real-time comprehension margins against GCSE milestones",
    plainSummary: "Finds exactly where your child stands.",
    purpose:
      "Identifies underlying informational topologies and specific structural deficiencies on entry.",
    ingests: [
      "Chronological age",
      "Documented prior learning trajectories",
      "Verified SEND designations",
      "Target grading tolerances",
      "Parent timelines",
    ],
    logic:
      "Initial test vector injection configured precisely at estimated baseline grade targets → Adaptive branch mutations based on Item Response Theory (IRT) parameters → Extraction of operational thresholds (latencies, velocity, confidence matrices).",
    deliverables: [
      "Base Grade Estimation",
      "Core Gap Topography",
      "Cognitive Processing Typology",
      "Projected Path-to-Ready Analytics",
    ],
    checker: {
      name: "Diagnostic Guard",
      role: "Validates problem selection for context mismatch; blocks if global baseline confidence drops below 90%.",
    },
    tech: ["Item Response Theory (IRT)", "GPT-4 Inference Patterns", "Latency Analytics"],
    color: "cyan",
    angle: 0,
  },
  {
    id: "teaching",
    number: "02",
    name: "Teaching Agent",
    shortName: "Teaching",
    tagline: "Translates curriculum into personalised modules in real time",
    plainSummary: "Explains concepts matched to how they learn.",
    purpose:
      "Dynamically modifies instructional approaches when friction is detected, with multi-path fallback routines.",
    ingests: [
      "Individual Cognitive Typology",
      "Active macro-syllabus positioning",
      "Historic review metrics",
      "Instant step-response validation",
    ],
    logic:
      "Extracts foundational schema from hardcoded curricular source arrays → Runs dynamic structural smoothing via RAG optimisation models → Evaluates step-by-step problem accuracy → Executes multi-path fallback routines on failure (maximum 3 deep iterations before structural routing escalation).",
    checker: {
      name: "Teaching Guard",
      role: "Forces factual deterministic assertions against curriculum records; enforces 95% threshold on generated explanation syntax.",
    },
    tech: ["Retrieval-Augmented Generation (RAG)", "Vector Search", "ElevenLabs API"],
    color: "violet",
    angle: 60,
  },
  {
    id: "assessment",
    number: "03",
    name: "Assessment Agent",
    shortName: "Assessment",
    tagline: "Evaluates output, predicts grades, detects regression risk",
    plainSummary: "Marks work and predicts grades fairly.",
    purpose:
      "Structures automated long-term grading approximations and uncovers non-linear regression risks.",
    ingests: [
      "Real-time event streams",
      "Structured unit quizzes",
      "Closed-environment exam paper arrays",
      "Macro tracking parameters",
    ],
    logic:
      "Runs automated heuristic parsing against structured input tokens while evaluating complex open-ended compositions against integrated assessment criteria and rubrics via fine-tuned contexts.",
    checker: {
      name: "Assessment Guard",
      role: "Validates AI parsing metrics against verified rubrics; detects anomalous click patterns or hint exploitation.",
    },
    tech: ["Deterministic Parsing", "GPT-4 Grading Contexts", "Regression Trend Projections"],
    color: "neon",
    angle: 120,
  },
  {
    id: "planning",
    number: "04",
    name: "Planning Agent",
    shortName: "Planning",
    tagline: "Optimises the two-year academic timeline dynamically",
    plainSummary: "Builds and adjusts the learning path.",
    purpose:
      "Automatically adjusts system velocity based on student mastery levels, balancing content against exam deadlines.",
    ingests: [
      "Diagnostic indicators",
      "Live processing logs",
      "Comprehensive mock evaluation arrays",
      "Targeted timelines",
    ],
    logic:
      "Runs constraint-satisfaction computations to balance content targets against rigid exam submission deadlines, creating prioritised task matrices and structured weekly milestones.",
    checker: {
      name: "Planning Guard",
      role: "Enforces 100% curriculum specification coverage; guarantees adjustment routines never omit prerequisite dependencies.",
    },
    tech: ["Constraint Satisfaction Solvers", "Reinforcement Optimisation"],
    color: "amber",
    angle: 180,
  },
  {
    id: "compliance",
    number: "05",
    name: "Compliance Agent",
    shortName: "Compliance",
    tagline: "Builds defensible Local Authority portfolios automatically",
    plainSummary: "Prepares council-ready evidence.",
    purpose:
      "Processes session data into professional compliance portfolios for Local Authority evaluations.",
    ingests: [
      "Encrypted instructional session logs",
      "System evaluation scores",
      "Parental verification markers",
      "Local statutory metrics",
    ],
    logic:
      "Groups database entries into statutory reporting categories (Breadth, Balance, Progression) and applies linguistic smoothing rules to construct high-quality, professional educational reviews.",
    checker: {
      name: "Compliance Guard",
      role: "Validates every narrative point against immutable database references; enforces strict data minimisation.",
    },
    tech: ["Jinja2 Engine / Puppeteer", "SHA-256 Hashing Protocols"],
    color: "crimson",
    angle: 240,
  },
  {
    id: "meta",
    number: "06",
    name: "Meta Checker Agent",
    shortName: "Meta Checker",
    tagline: "System-wide supervisor catching drift and bias",
    plainSummary: "Watches the system for any issues.",
    purpose:
      "Monitors the entire multi-agent environment to catch systemic model drift, bias patterns, or proxy alignment failures.",
    ingests: [
      "Global execution outputs",
      "Worker-to-checker divergence logs",
      "System escalation histories",
      "System error logs",
    ],
    logic:
      "Continuously pulls statistical 5% audit samples across all operational transactions; evaluates semantic divergence boundaries; raises systemic alerts if error distributions cross target limits.",
    checker: {
      name: "Admin Console",
      role: "Output pipelines terminate at a specialised administrative monitoring console for scheduled human review.",
    },
    tech: ["Drift Assessment Engines", "Semantic Inconsistency Filters"],
    color: "fog",
    angle: 300,
  },
];
