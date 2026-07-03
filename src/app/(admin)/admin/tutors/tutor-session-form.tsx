"use client";

import { useActionState } from "react";
import { CalendarClock, Check, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TutorAccount } from "@/lib/db/repo";
import {
  createTutorAccount,
  logTutorSession,
  scheduleTutorSession,
  type TutorActionResult,
} from "./actions";

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

export function CreateTutorAccountForm() {
  const [state, action, pending] = useActionState(
    async (_prev: TutorActionResult | null, formData: FormData) =>
      createTutorAccount(formData),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-violet-300" />
        <h3 className="text-sm font-semibold text-fog-50">Create tutor login</h3>
      </div>
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Tutor name
        <input
          name="fullName"
          required
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Email
        <input
          name="email"
          type="email"
          required
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Temporary password
        <input
          name="temporaryPassword"
          type="text"
          minLength={8}
          required
          placeholder="Share securely with the tutor"
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Reason
        <input
          name="reason"
          required
          placeholder="e.g. Contracted GCSE English tutor"
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      {state && (
        <p className={`text-xs ${state.ok ? "text-neon-300" : "text-amber-300"}`}>
          {state.ok ? state.message : state.error}
        </p>
      )}
      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}

export function TutorScheduleForm({
  bookingId,
  tutors,
}: {
  bookingId: string;
  tutors: TutorAccount[];
}) {
  const [state, action, pending] = useActionState(
    async (_prev: TutorActionResult | null, formData: FormData) =>
      scheduleTutorSession(formData),
    null,
  );

  if (tutors.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
        Create a tutor account before scheduling this request.
      </p>
    );
  }

  return (
    <form action={action} className="mt-3 grid gap-2 border-t border-white/5 pt-3 md:grid-cols-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="flex flex-col gap-1 text-xs text-fog-400 md:col-span-2">
        Tutor
        <select
          name="tutorId"
          required
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none"
        >
          {tutors
            .filter((t) => t.active)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Date/time
        <input
          name="scheduledAt"
          type="datetime-local"
          required
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-fog-400">
        Minutes
        <input
          name="durationMinutes"
          type="number"
          min={15}
          max={120}
          defaultValue={30}
          required
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-fog-400 md:col-span-4">
        Reason
        <input
          name="reason"
          required
          placeholder="Why this tutor/time?"
          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:border-violet-400/60 focus:outline-none"
        />
      </label>
      <Button type="submit" variant="secondary" size="sm" disabled={pending} className="self-end">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
        Schedule
      </Button>
      {state && (
        <p className={`md:col-span-5 text-xs ${state.ok ? "text-neon-300" : "text-amber-300"}`}>
          {state.ok ? state.message : state.error}
        </p>
      )}
    </form>
  );
}
