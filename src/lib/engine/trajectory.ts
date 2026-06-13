/**
 * GCSE readiness trajectory — pure projection maths from real evaluation
 * history. No AI: a simple least-squares line through the (time, grade) points,
 * extended toward the target exam date. With fewer than two points there is no
 * meaningful trend, so the caller shows an encouraging empty state instead.
 */

export interface GradePoint {
  /** Epoch ms of the evaluation. */
  t: number;
  /** Numeric GCSE grade (1–9). */
  grade: number;
  mock: boolean;
}

export interface Projection {
  /** Whether a trend line could be computed (≥ 2 points). */
  hasTrend: boolean;
  /** Projected grade at the target time, clamped 1–9 (null when no trend). */
  projectedGrade: number | null;
  /** Slope in grades per 30 days (for a human-readable trend), null when flat. */
  gradesPerMonth: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Least-squares projection of grade at `targetT` from the given points.
 * @param points    chronological (or any order) grade points
 * @param targetT   epoch ms of the target exam window
 */
export function projectGrade(points: GradePoint[], targetT: number): Projection {
  if (points.length < 2) {
    return { hasTrend: false, projectedGrade: null, gradesPerMonth: null };
  }

  const n = points.length;
  const meanT = points.reduce((s, p) => s + p.t, 0) / n;
  const meanG = points.reduce((s, p) => s + p.grade, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.t - meanT) * (p.grade - meanG);
    den += (p.t - meanT) ** 2;
  }

  // All points at the same instant → no slope; treat as flat at the mean.
  const slope = den === 0 ? 0 : num / den; // grades per ms
  const intercept = meanG - slope * meanT;

  const raw = slope * targetT + intercept;
  const projectedGrade = Math.max(1, Math.min(9, Math.round(raw * 10) / 10));
  const gradesPerMonth = den === 0 ? 0 : Math.round(slope * 30 * DAY_MS * 100) / 100;

  return { hasTrend: true, projectedGrade, gradesPerMonth };
}

/**
 * Parse a target exam window label (e.g. "Summer 2028", "June 2027",
 * "2028") to an approximate epoch ms. Returns null when nothing parseable.
 * Summer → June, Autumn/Winter → November, otherwise mid-year.
 */
export function parseTargetWindow(window: string | null | undefined): number | null {
  if (!window) return null;
  const yearMatch = window.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);
  const lower = window.toLowerCase();
  let month = 5; // default June (0-indexed)
  if (lower.includes("autumn") || lower.includes("winter") || lower.includes("nov")) {
    month = 10;
  } else if (lower.includes("spring") || lower.includes("mar")) {
    month = 2;
  } else if (lower.includes("summer") || lower.includes("jun")) {
    month = 5;
  }
  return Date.UTC(year, month, 15);
}
