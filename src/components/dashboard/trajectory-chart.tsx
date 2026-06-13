import { TrendingUp } from "lucide-react";
import { projectGrade, parseTargetWindow, type GradePoint } from "@/lib/engine/trajectory";
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
}: {
  history: EvaluationPoint[];
  targetWindow: string | null;
}) {
  const hasData = history.length >= 2;

  if (!hasData) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <TrendingUp className="mx-auto mb-3 h-6 w-6 text-fog-500" />
        <p className="text-sm text-fog-300">
          Run a mock exam to see the trajectory.
        </p>
        <p className="mt-1 text-xs text-fog-500">
          We&apos;ll chart progress here once there are at least two assessments.
        </p>
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
              <path d={path} fill="none" stroke={s.stroke} strokeWidth={2} />
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
