"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addCurriculumQuestion,
  type CurriculumActionResult,
} from "./actions";
import type { Subject } from "@/lib/db/types";

const initialState: CurriculumActionResult = { ok: false };

export function QuestionForm({
  topicTag,
  subject,
  keyStage,
}: {
  topicTag: string;
  subject: Subject;
  keyStage: number;
}) {
  const [state, formAction, pending] = useActionState(
    addCurriculumQuestion,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
    >
      <input type="hidden" name="topicTag" value={topicTag} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="keyStage" value={keyStage} />

      <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fog-400">
            Prompt
          </span>
          <input
            name="prompt"
            required
            placeholder="Question prompt"
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fog-400">
            Type
          </span>
          <select
            name="kind"
            defaultValue="practice"
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          >
            <option value="diagnostic">Diagnostic</option>
            <option value="practice">Practice</option>
            <option value="mastery">Mastery</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fog-400">
            Tier
          </span>
          <input
            name="tier"
            type="number"
            min={1}
            max={5}
            defaultValue={3}
            required
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <label key={index} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-fog-400">
              Option {index + 1}
            </span>
            <input
              name={`option${index}`}
              required={index < 2}
              placeholder={index < 2 ? "Required" : "Optional"}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fog-400">
            Correct
          </span>
          <select
            name="correctIndex"
            defaultValue="0"
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          >
            <option value="0">Option 1</option>
            <option value="1">Option 2</option>
            <option value="2">Option 3</option>
            <option value="3">Option 4</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fog-400">
            Explanation
          </span>
          <input
            name="explanation"
            required
            placeholder="Human-authored explanation shown after an answer"
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {state.error ? (
          <p className="text-xs text-crimson-400">{state.error}</p>
        ) : (
          <p className="text-xs text-fog-500">Adds a standard MCQ to this topic.</p>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          <Plus className="h-4 w-4" />
          {pending ? "Adding..." : "Add question"}
        </Button>
      </div>
    </form>
  );
}
