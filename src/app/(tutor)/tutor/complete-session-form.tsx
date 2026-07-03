"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeTutorSession, type TutorPortalActionResult } from "./actions";

export function CompleteSessionForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: TutorPortalActionResult | null, formData: FormData) =>
      completeTutorSession(formData),
    null,
  );

  if (state?.ok) {
    return (
      <p className="inline-flex items-center gap-2 rounded-xl border border-neon-400/20 bg-neon-500/5 px-4 py-3 text-sm text-neon-300">
        <Check className="h-4 w-4" />
        Session completed.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Session note
        <textarea
          name="note"
          rows={4}
          required
          placeholder="What did you cover? What should the child try next?"
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-50 placeholder:text-fog-500 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      {state?.error && <p className="text-xs text-amber-300">{state.error}</p>}
      <Button type="submit" variant="neon" size="sm" disabled={pending} className="self-start">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Complete session
      </Button>
    </form>
  );
}
