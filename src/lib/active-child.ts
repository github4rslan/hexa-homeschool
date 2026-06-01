import "server-only";
import { cookies } from "next/headers";

/**
 * The parent's currently-selected child id, stored in a cookie so lessons,
 * diagnostics and the dashboard all act on the same child when a family has
 * more than one.
 */
const COOKIE = "hexa_active_child";

export async function readActiveChildId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE)?.value || undefined;
}

export async function writeActiveChildId(childId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, childId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export const ACTIVE_CHILD_COOKIE = COOKIE;
