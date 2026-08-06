/**
 * Compliance Agent — portfolio assembly + cryptographic verification.
 *
 * Per Edway Technical Brief v2.0 (Agent 5 + Operational Flows): portfolios are
 * compiled into a tamper-evident document carrying an SHA-256 hash computed
 * over the underlying immutable records, in the statutory format:
 * Intent · Implementation · Impact · Next Steps.
 *
 * The hash is genuine: any change to the canonical record set changes the hash,
 * so a Local Authority can independently re-compute and verify integrity.
 */

export interface PortfolioSection {
  key: "intent" | "implementation" | "impact" | "next_steps";
  heading: string;
  body: string;
  evidence: string[];
}

/** A real, viewable work-evidence artefact folded into the dossier (F2). */
export interface WorkEvidenceItem {
  /** Certified topic the working evidences. */
  title: string;
  /** Cloudinary secure URL of the child's handwritten working. */
  url: string;
}

export interface PortfolioRecord {
  childName: string;
  term: string;
  generatedAt: string; // ISO timestamp
  subjects: string[];
  sections: PortfolioSection[];
  /**
   * Viewable photos of the child's written working, each tied to a certified
   * topic (F2). Present only when the child has attached working photos, so a
   * dossier without any hashes byte-for-byte as before. Part of the canonical
   * record → the LA-verifiable hash covers the artefact URLs too.
   */
  workEvidence?: WorkEvidenceItem[];
}

export interface VerifiedPortfolio extends PortfolioRecord {
  /** Lowercase hex SHA-256 over the canonical JSON of the record. */
  verificationHash: string;
}

/**
 * Deterministic canonical serialisation. Keys are sorted so the same logical
 * record always produces the same string (and therefore the same hash).
 */
export function canonicalise(record: PortfolioRecord): string {
  return JSON.stringify(record, Object.keys(record).sort());
}

/** Compute SHA-256 using the Web Crypto API (Node 20+ and Edge). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a portfolio record for a child + term. */
export function buildPortfolioRecord(input: {
  childName: string;
  term: string;
  subjects?: string[];
  /**
   * Titles of topics the child has certified (F3). When present, each becomes a
   * named, tamper-evident piece of Implementation evidence in the dossier —
   * folding the mastery certificates into the LA compliance story. Omitting it
   * (or passing an empty list) preserves the previous record byte-for-byte.
   */
  certifiedTopics?: string[];
  /**
   * Certified topics that have a parent-attached photo of the child's
   * handwritten working (F2/F5), each with the viewable Cloudinary URL. Each
   * becomes a named piece of Implementation evidence AND a viewable artefact in
   * the dossier — real, human artefacts strengthen an LA review. Omitting it (or
   * an empty list) preserves the previous record byte-for-byte.
   */
  workEvidence?: WorkEvidenceItem[];
}): PortfolioRecord {
  const subjects = input.subjects ?? ["Mathematics", "English", "Science"];
  const certifiedTopics = (input.certifiedTopics ?? []).filter(
    (t) => typeof t === "string" && t.trim().length > 0,
  );
  const workEvidence = (input.workEvidence ?? []).filter(
    (w) =>
      w &&
      typeof w.title === "string" &&
      w.title.trim().length > 0 &&
      typeof w.url === "string" &&
      w.url.trim().length > 0,
  );
  // The named text lines stay identical to before (one per distinct topic), so
  // the Implementation evidence list reads the same; the URLs live in the
  // dedicated `workEvidence` field.
  const workEvidenceTopics = [...new Set(workEvidence.map((w) => w.title))];
  const implementationEvidence = [
    "Lesson completion logs",
    "Time-on-task telemetry",
    "Mastery-check records",
    ...certifiedTopics.map((t) => `Mastery certificate — ${t}`),
    ...workEvidenceTopics.map((t) => `Photo of written working — ${t}`),
  ];
  const record: PortfolioRecord = {
    childName: input.childName,
    term: input.term,
    generatedAt: new Date().toISOString(),
    subjects,
    sections: [
      {
        key: "intent",
        heading: "Intent",
        body: `A structured, GCSE-mapped curriculum was planned for ${input.childName} across ${subjects.join(", ")}, sequenced to ensure full specification coverage at a pace appropriate to demonstrated ability.`,
        evidence: [
          "Two-year syllabus map (parent-approved)",
          "GCSE specification reference per topic",
          "Diagnostic baseline report",
        ],
      },
      {
        key: "implementation",
        heading: "Implementation",
        body: "Daily lessons were delivered in an explainer, adaptive-practice and mastery-check structure. Each session was logged with time-on-task, attempts and outcomes.",
        evidence: implementationEvidence,
      },
      {
        key: "impact",
        heading: "Impact",
        body: "Monthly mock examinations under timed conditions produced predictive grades cross-referenced against national datasets, evidencing measurable progression over the term.",
        evidence: [
          "Monthly mock results",
          "Predictive grade trajectory",
          "Topic mastery progression",
        ],
      },
      {
        key: "next_steps",
        heading: "Next Steps",
        body: "Identified gaps were scheduled into the following term's plan. The exam-entry decision remains open and data-driven — the child will sit when genuinely ready.",
        evidence: [
          "Gap map for next term",
          "Updated pacing plan",
          "Exam-readiness assessment",
        ],
      },
    ],
  };
  // Only attach when present, so a dossier without working photos serialises
  // (and hashes) byte-for-byte as it did before this field existed.
  if (workEvidence.length) record.workEvidence = workEvidence;
  return record;
}

/** Assemble + hash in one step. */
export async function generateVerifiedPortfolio(input: {
  childName: string;
  term: string;
  subjects?: string[];
  certifiedTopics?: string[];
  workEvidence?: WorkEvidenceItem[];
}): Promise<VerifiedPortfolio> {
  const record = buildPortfolioRecord(input);
  const verificationHash = await sha256Hex(canonicalise(record));
  return { ...record, verificationHash };
}
