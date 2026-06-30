"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logTutorSession, type TutorActionResult } from "./actions";

/**
 * Inline "log tutor session" control for a queued request. Calls the staff
 * action and shows success/error in place — for a remediation handoff the note
 * feeds the child's next explanation and lifts the syllabus pause.
 */
export function TutorSessionForm({
  bookingId,
  placeholder,
}: {
  bookingId: string;
  placeholder: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: TutorActionResult | null, formData: FormData) =>
      logTutorSession(formData),
    null,
  );

  if (state?.ok) {
    return (
      <p className="mt-3 inline-flex items-center gap-2 border-t border-white/5 pt-3 text-sm text-neon-300">
        <Check className="h-4 w-4" /> Session logged — note sent to the child&apos;s
        next lesson.
      </p>
    );
  }

  return (
    <form
      action={action}
      className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3 sm:flex-row sm:items-start"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex-1">
        <textarea
          name="note"
          rows={2}
          required
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
        />
        {state?.error && (
          <p className="mt-1 text-xs text-amber-300">{state.error}</p>
        )}
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log session"}
      </Button>
    </form>
  );
}
