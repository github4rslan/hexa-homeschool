"use client";

import { useTransition } from "react";
import { Users, Loader2 } from "lucide-react";
import { setActiveChild } from "@/app/(dashboard)/actions";
import type { SwitcherChild } from "@/components/dashboard/child-switcher";

/**
 * Compact inline active-child switcher for the per-child page headers
 * (schedule, tutoring) — so a multi-child parent always sees *which* child the
 * page is acting on and can switch in one tap, without digging into the
 * hamburger. Reuses the ownership-checked `setActiveChild` server action (which
 * revalidates the layout, re-rendering the page for the newly selected child).
 *
 * With a single child there's nothing to switch, so it renders a static label.
 */
export function InlineChildSwitcher({
  items,
  activeId,
}: {
  items: SwitcherChild[];
  activeId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-200">
        <Users className="h-4 w-4 shrink-0 text-violet-300" />
        {items[0].name}
      </span>
    );
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-200 focus-within:border-violet-400/50">
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-300" />
      ) : (
        <Users className="h-4 w-4 shrink-0 text-violet-300" />
      )}
      <span className="sr-only">Active child</span>
      <select
        defaultValue={activeId ?? items[0].id}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => setActiveChild(e.target.value))
        }
        className="cursor-pointer bg-transparent pr-1 text-sm font-medium text-fog-100 outline-none disabled:opacity-60 [&>option]:text-ink"
      >
        {items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
