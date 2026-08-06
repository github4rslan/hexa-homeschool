import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import { EmptyIllustration } from "@/components/fx/empty-illustration";
import {
  projectGrade,
  parseTargetWindow,
  certificationSeries,
  type GradePoint,
} from "@/lib/engine/trajectory";
import type { EvaluationPoint } from "@/lib/db/repo";
import type { Subject } from "@/lib/db/types";

/**
 * GCSE readiness trajectory — a lightweight inline-SVG chart (no chart library)
 * of each subject's evaluation history (diagnostics + mocks) with a dashed
 * projection toward the target exam window. Pure server component: all data is
 * deterministic from evaluation_records. With < 2 points for every subject it
 * renders an encouraging empty state instead of a fake line.
 */

const SUBJECTS: { id: Subject; label: string; stroke: string; dot: string }[] = [
  { id: "mathematics", label: "Maths", stroke: "#8b5cf6", dot: "#a78bfa" },
  { id: "english", label: "English", stroke: "#06b6d4", dot: "#22d3ee" },
  { id: "science", label: "Science", stroke: "#84cc16", dot: "#a3e635" },
];

const W = 520;
const H = 200;
const PAD = { left: 28, right: 16, top: 12, bottom: 24 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function yForGrade(grade: number): number {
  // Grades 1–9 mapped top(9) → bottom(1).
  const frac = (grade - 1) / 8;
  return PAD.top + (1 - frac) * PLOT_H;
}

export function TrajectoryChart({
  history,
  targetWindow,
  certifiedAt = [],
}: {
  history: EvaluationPoint[];
  targetWindow: string | null;
  /**
   * Dates each topic was certified (F5). When there aren't yet two grade
   * assessments to project from, we chart these certification milestones as
   * honest PROGRESS evidence (never a predicted grade) instead of an empty state.
   */
  certifiedAt?: Date[];
}) {
  const hasData = history.length >= 2;

  if (!hasData) {
    const certSeries = certificationSeries(certifiedAt);
    // A lesson-only family: show real certification milestones over time rather
    // than an empty "run a mock" panel. Labelled as progress, not a grade.
    if (certSeries.length >= 2) {
      return <CertificationChart series={certSeries} />;
    }
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <EmptyIllustration name="chart" className="mx-auto mb-3 text-fog-500" />
        <p className="text-sm text-fog-300">
          Run a mock exam to see the readiness trajectory.
        </p>
        <p className="mt-1 text-xs text-fog-500">
          {certSeries.length === 1
            ? "One topic certified so far — certify another and your progress starts charting here."
            : "We’ll chart progress here as topics get certified, and readiness once there are two assessments."}
        </p>
        <Link
          href="/learn/mock"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          Start a mock exam
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const times = history.map((p) => p.at.getTime());
  const targetT = parseTargetWindow(targetWindow);
  const minT = Math.min(...times);
  const maxT = Math.max(...times, targetT ?? -Infinity);
  const spanT = Math.max(1, maxT - minT);

  const xForTime = (t: number) => PAD.left + ((t - minT) / spanT) * PLOT_W;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="GCSE readiness trajectory by subject"
      >
        {/* Horizontal grade gridlines (3, 5, 7, 9). */}
        {[3, 5, 7, 9].map((g) => (
          <g key={g}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yForGrade(g)}
              y2={yForGrade(g)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <text
              x={4}
              y={yForGrade(g) + 4}
              fontSize={10}
              fill="rgba(255,255,255,0.35)"
            >
              {g}
            </text>
          </g>
        ))}

        {SUBJECTS.map((s) => {
          const pts = history
            .filter((p) => p.subject === s.id)
            .map<GradePoint>((p) => ({ t: p.at.getTime(), grade: p.grade, mock: p.mock }));
          if (pts.length === 0) return null;

          const path = pts
            .map((p, i) => `${i === 0 ? "M" : "L"} ${xForTime(p.t)} ${yForGrade(p.grade)}`)
            .join(" ");

          // Projection segment from the last point to the target window.
          let projPath: string | null = null;
          if (targetT && pts.length >= 2) {
            const proj = projectGrade(pts, targetT);
            if (proj.hasTrend && proj.projectedGrade !== null) {
              const last = pts[pts.length - 1];
              projPath = `M ${xForTime(last.t)} ${yForGrade(last.grade)} L ${xForTime(targetT)} ${yForGrade(proj.projectedGrade)}`;
            }
          }

          return (
            <g key={s.id}>
              {projPath && (
                <path
                  d={projPath}
                  fill="none"
                  stroke={s.stroke}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              )}
              <path
                d={path}
                fill="none"
                stroke={s.stroke}
                strokeWidth={2}
                pathLength={1}
                className="traj-line"
              />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={xForTime(p.t)}
                  cy={yForGrade(p.grade)}
                  r={p.mock ? 4 : 3}
                  fill={p.mock ? s.dot : "#0a0a0a"}
                  stroke={s.stroke}
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}

        {targetT && (
          <line
            x1={xForTime(targetT)}
            x2={xForTime(targetT)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fog-400">
        {SUBJECTS.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.stroke }} />
            {s.label}
          </span>
        ))}
        <span className="text-fog-500">
          Filled dot = mock exam · open dot = diagnostic · dashed = projection
          {targetWindow ? ` to ${targetWindow}` : ""}
        </span>
      </div>
    </div>
  );
}

/**
 * Certification-milestones chart (F5) — a cumulative "topics certified over
 * time" line for families doing daily lessons before mocks unlock. Honest
 * progress evidence, explicitly NOT a predicted grade. Pure server component.
 */
function CertificationChart({
  series,
}: {
  series: { t: number; count: number }[];
}) {
  const times = series.map((p) => p.t);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const spanT = Math.max(1, maxT - minT);
  const maxCount = series[series.length - 1].count;

  const xForTime = (t: number) => PAD.left + ((t - minT) / spanT) * PLOT_W;
  const yForCount = (c: number) => {
    const frac = maxCount <= 1 ? 1 : c / maxCount;
    return PAD.top + (1 - frac) * PLOT_H;
  };

  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xForTime(p.t)} ${yForCount(p.count)}`)
    .join(" ");

  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Europe/London",
    });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Award className="h-4 w-4 text-neon-300" />
        <p className="text-sm text-fog-300">
          Topics certified over time — real progress while mock exams unlock.
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Topics certified over time: ${maxCount} so far`}
      >
        {/* Baseline */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + PLOT_H}
          y2={PAD.top + PLOT_H}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        <path d={path} fill="none" stroke="#84cc16" strokeWidth={2} pathLength={1} className="traj-line" />
        {series.map((p, i) => (
          <g key={i}>
            <circle
              cx={xForTime(p.t)}
              cy={yForCount(p.count)}
              r={3}
              fill="#a3e635"
              stroke="#84cc16"
              strokeWidth={1.5}
            />
            {(i === 0 || i === series.length - 1) && (
              <text
                x={xForTime(p.t)}
                y={H - 8}
                fontSize={10}
                fill="rgba(255,255,255,0.4)"
                textAnchor={i === 0 ? "start" : "end"}
              >
                {fmt(p.t)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs text-fog-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neon-400" />
          {maxCount} topic{maxCount === 1 ? "" : "s"} certified
        </span>
        <span className="text-fog-500">
          Progress evidence — not a predicted grade. Readiness charts once mocks begin.
        </span>
      </div>
    </div>
  );
}
