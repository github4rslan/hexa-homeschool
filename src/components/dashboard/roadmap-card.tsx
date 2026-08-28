import { Check, Circle, Dot, Map as MapIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { RoadmapTopic } from "@/lib/engine/roadmap";

/**
 * F4 — parent-facing per-child curriculum roadmap. For each subject it shows the
 * ordered topics in the child's current band with a certified ✓ / current • /
 * upcoming ◦ marker, so a homeschooling parent gets the forward view ("three
 * more Maths topics then she moves up") the trajectory + certified count don't
 * give. Presentation only; deterministic data, no AI. Band language stays
 * parent-only (never shown to the child).
 */

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

const KEY_STAGE_LABEL: Record<number, string> = {
  2: "primary level",
  3: "lower-secondary level",
  4: "GCSE level",
};

function StateMark({ state }: { state: RoadmapTopic["state"] }) {
  if (state === "certified") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neon-400/40 bg-neon-500/15 text-neon-300">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-400/50 bg-violet-500/15 text-violet-200">
        <Dot className="h-5 w-5" strokeWidth={4} />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-fog-600">
      <Circle className="h-3 w-3" />
    </span>
  );
}

export function RoadmapCard({
  subjects,
  childFirstName,
}: {
  subjects: { subject: string; keyStage: number; topics: RoadmapTopic[] }[];
  childFirstName: string;
}) {
  const hasAny = subjects.some((s) => s.topics.length > 0);
  return (
    <Card variant="glass" padding="xl" className="mb-6">
      <div className="mb-1 flex items-center gap-2">
        <MapIcon className="h-4 w-4 text-cyan-300" />
        <h2 className="text-lg font-semibold text-fog-50">Curriculum roadmap</h2>
      </div>
      <p className="mb-5 text-sm text-fog-400">
        What {childFirstName} is working through now and what&apos;s coming next,
        by subject. Topics advance a level automatically once the whole band is
        certified.
      </p>
      {!hasAny ? (
        <p className="text-sm text-fog-500">
          The roadmap fills in as topics are added for {childFirstName}&apos;s
          level.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {subjects.map((s) => (
            <div
              key={s.subject}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
            >
              <div className="mb-1 text-sm font-semibold text-fog-50">
                {SUBJECT_LABEL[s.subject] ?? s.subject}
              </div>
              <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-fog-500">
                {KEY_STAGE_LABEL[s.keyStage] ?? "current band"}
              </div>
              {s.topics.length === 0 ? (
                <p className="text-xs text-fog-500">No topics yet.</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {s.topics.map((t) => (
                    <li key={t.topicTag} className="flex items-center gap-2.5">
                      <StateMark state={t.state} />
                      <span
                        className={
                          t.state === "certified"
                            ? "text-sm text-fog-300"
                            : t.state === "current"
                              ? "text-sm font-semibold text-fog-50"
                              : "text-sm text-fog-400"
                        }
                      >
                        {t.title}
                        {t.workingGradeBand && (
                          <span className="ml-1.5 text-xs font-normal text-fog-500">
                            · {t.workingGradeBand}
                          </span>
                        )}
                        {t.state === "current" && (
                          <>
                            {" "}
                            <span className="ml-1.5 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-200">
                              Now
                            </span>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
