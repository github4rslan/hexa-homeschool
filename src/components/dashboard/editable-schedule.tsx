"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Pencil, X, Check, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { swapTopic, moveDay, clearDay } from "@/app/(dashboard)/schedule/actions";
import type { ScheduleItemDoc, Subject } from "@/lib/db/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

export interface SwapOption {
  topicTag: string;
  title: string;
}

/**
 * Editable weekly plan. Each item can have its topic swapped (to an uncertified
 * topic in the same subject), be moved to another weekday, or have its whole day
 * cleared. Every edit is a parent approval (no separate approve step for their
 * own change) and stamps the item reason as "Chosen by you." Server actions do
 * the ownership-checked writes; the page re-renders from the source of truth.
 */
export function EditableSchedule({
  items,
  swapOptionsBySubject,
}: {
  items: ScheduleItemDoc[];
  swapOptionsBySubject: Record<Subject, SwapOption[]>;
}) {
  const [editing, setEditing] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-fog-400">
        No plan items this week. Use “Regenerate week” to build a fresh plan, or
        a cleared day stays clear until then.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const options = swapOptionsBySubject[item.subject] ?? [];
        const isEditing = editing === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-24 shrink-0 text-sm font-medium text-fog-300">
                {DAYS[item.day]}
              </span>
              <Badge variant="violet" size="sm">
                {SUBJECT_LABEL[item.subject]}
              </Badge>
              <span className="min-w-[10rem] flex-1 text-sm text-fog-100">
                {item.topic_title}
              </span>
              <Link
                href={`/learn/lesson?topic=${item.topic_tag}`}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                <Sparkles className="h-3.5 w-3.5" /> Start
              </Link>
              <button
                type="button"
                onClick={() => setEditing(isEditing ? null : i)}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-fog-400 hover:text-fog-100"
                aria-expanded={isEditing}
              >
                {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {isEditing ? "Close" : "Edit"}
              </button>
            </div>

            {item.reason && (
              <p className="mt-2 text-xs leading-relaxed text-fog-500 sm:pl-[7rem]">
                Why: {item.reason}
              </p>
            )}

            {isEditing && (
              <div className="mt-4 grid gap-4 border-t border-white/5 pt-4 sm:pl-[7rem]">
                {/* Swap topic */}
                <form action={swapTopic} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="itemIndex" value={i} />
                  <label className="text-xs text-fog-400">Topic:</label>
                  <select
                    name="topicTag"
                    defaultValue={item.topic_tag}
                    className="min-h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-fog-100"
                  >
                    {/* Ensure the current topic is selectable even if certified. */}
                    {!options.some((o) => o.topicTag === item.topic_tag) && (
                      <option value={item.topic_tag}>{item.topic_title}</option>
                    )}
                    {options.map((o) => (
                      <option key={o.topicTag} value={o.topicTag}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-violet-500/20 px-3 text-xs font-medium text-violet-200 hover:bg-violet-500/30"
                  >
                    <Check className="h-3.5 w-3.5" /> Swap
                  </button>
                </form>

                {/* Move day */}
                <form action={moveDay} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="itemIndex" value={i} />
                  <label className="text-xs text-fog-400">Move to:</label>
                  <select
                    name="newDay"
                    defaultValue={item.day}
                    className="min-h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-fog-100"
                  >
                    {DAYS.map((d, di) => (
                      <option key={di} value={di}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-xs font-medium text-fog-200 hover:bg-white/10"
                  >
                    <CalendarDays className="h-3.5 w-3.5" /> Move
                  </button>
                </form>

                {/* Clear day */}
                <form action={clearDay}>
                  <input type="hidden" name="day" value={item.day} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-crimson-400 hover:text-crimson-300"
                  >
                    <X className="h-3.5 w-3.5" /> Clear {DAYS[item.day]} (we&apos;re away)
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
