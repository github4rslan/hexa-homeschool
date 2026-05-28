import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChildCardProps {
  id: string;
  name: string;
  age: number;
  predictedGrade?: string;
  competenceCertified: number;
  competenceTotal: number;
  nextLesson?: string;
  status: "on_track" | "behind" | "ahead" | "needs_review";
}

const statusMap = {
  on_track: { label: "On track", variant: "neon" as const },
  ahead: { label: "Ahead", variant: "cyan" as const },
  behind: { label: "Behind", variant: "amber" as const },
  needs_review: { label: "Needs review", variant: "crimson" as const },
};

export function ChildCard({
  id,
  name,
  age,
  predictedGrade,
  competenceCertified,
  competenceTotal,
  nextLesson,
  status,
}: ChildCardProps) {
  const percent = competenceTotal > 0 ? (competenceCertified / competenceTotal) * 100 : 0;
  const statusInfo = statusMap[status];

  return (
    <Card variant="glass" padding="lg" interactive glow="violet">
      <Link href={`/dashboard/children/${id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white font-semibold">
              {name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-fog-50">{name}</h3>
              <span className="text-xs text-fog-400">Age {age}</span>
            </div>
          </div>
          <Badge variant={statusInfo.variant} size="sm" pulse>
            {statusInfo.label}
          </Badge>
        </div>

        {predictedGrade && (
          <div className="flex items-end gap-3 mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                Predicted Grade
              </span>
              <div className="text-3xl font-semibold text-gradient-aurora">
                {predictedGrade}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-fog-400">Curriculum mastery</span>
            <span className="text-fog-200 font-medium">
              {competenceCertified} / {competenceTotal}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-neon-400 rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {nextLesson && (
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-fog-400">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              <span>Next: {nextLesson}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-fog-500" />
          </div>
        )}
      </Link>
    </Card>
  );
}
