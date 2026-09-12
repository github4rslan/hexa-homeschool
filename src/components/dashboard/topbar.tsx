import {
  currentParentId,
  listActivityFeed,
  getLastNotificationsViewedAt,
} from "@/lib/db/repo";
import type { ActivityFeedRow } from "@/components/dashboard/activity-feed";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { countUnreadNotifications } from "@/lib/engine/parent-events";

/** Matches the relative-time phrasing used elsewhere on the dashboard. */
function relativeTime(d: Date): string {
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
}

export async function DashboardTopbar({ greeting }: { greeting?: string }) {
  // F6: a real notifications panel, reusing the exact data (parent_events
  // plus recent lesson activity) that already powers the "Recent activity"
  // card, replacing the permanently-removed (2026-09-08) fake-unread-dot bell.
  const parentId = await currentParentId();
  let rows: ActivityFeedRow[] = [];
  let unread = 0;
  if (parentId) {
    const [items, lastViewedAt] = await Promise.all([
      listActivityFeed(parentId, 8),
      getLastNotificationsViewedAt(parentId),
    ]);
    rows = items.map((f) => ({
      kind: f.kind,
      childName: f.childName,
      topicTitle: f.topicTitle,
      attempts: f.attempts,
      time: relativeTime(f.at),
    }));
    unread = countUnreadNotifications(items.map((f) => f.at), lastViewedAt);
  }

  return (
    <header className="h-16 border-b border-white/5 bg-abyss/70 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-fog-500">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Europe/London",
          })}
        </span>
        {greeting && (
          <h1 className="text-base font-semibold text-fog-50">{greeting}</h1>
        )}
      </div>
      {parentId && <NotificationsBell items={rows} initialUnreadCount={unread} />}
    </header>
  );
}
