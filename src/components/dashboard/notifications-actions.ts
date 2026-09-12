"use server";

import { currentParentId, markNotificationsViewed } from "@/lib/db/repo";

/**
 * F6: mark the notifications panel as viewed for the signed-in parent.
 * Best-effort (no session = silent no-op); never throws to the caller so a
 * write hiccup can't stop the panel opening.
 */
export async function markNotificationsViewedAction(): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId) return;
  await markNotificationsViewed(parentId).catch(() => {});
}
