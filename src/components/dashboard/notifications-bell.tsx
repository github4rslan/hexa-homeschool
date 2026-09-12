"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { ActivityFeedRow } from "@/components/dashboard/activity-feed";
import { ACTIVITY_FEED_STYLES, presentActivityFeedRow } from "@/components/dashboard/activity-feed";
import { markNotificationsViewedAction } from "@/components/dashboard/notifications-actions";

/**
 * F6: a real notifications panel, replacing the permanently-removed
 * (2026-09-08) fake-unread-dot bell. Reuses the same real data that already
 * powers the dashboard's "Recent activity" card (parent_events + recent
 * lesson activity), no new write path, no child-identifying content (the
 * feed itself already excludes that per its own Children's Code scoping).
 *
 * The badge count is genuinely real: rows newer than the parent's own
 * `last_notifications_viewed_at` (server-computed). Opening the panel marks
 * everything as seen going forward (optimistic locally, persisted via a
 * best-effort server action); it never blocks or delays opening.
 */
export function NotificationsBell({
  items,
  initialUnreadCount,
}: {
  items: ActivityFeedRow[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnreadCount);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggle() {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen && unread > 0) {
        setUnread(0);
        void markNotificationsViewedAction();
      }
      return willOpen;
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-fog-300 transition-colors hover:border-white/20 hover:text-fog-100"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon-500 px-1 text-[10px] font-semibold text-void">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-abyss/95 backdrop-blur-xl p-2 shadow-xl">
          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-fog-500">
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-fog-400">
              Nothing here yet. Real milestones will show up as they happen.
            </p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
              {items.map((row, i) => {
                const s = ACTIVITY_FEED_STYLES[row.kind];
                const { title, detail } = presentActivityFeedRow(row);
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${s.ring}`}
                    >
                      <s.Icon className={`h-3.5 w-3.5 ${s.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fog-100">{title}</p>
                      <p className="truncate text-xs text-fog-400">{detail}</p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-fog-500">
                      {row.time}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
