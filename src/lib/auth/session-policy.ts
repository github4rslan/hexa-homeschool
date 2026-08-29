/**
 * Pure session-lifetime policy (B3 fix). The `/login` "Remember me" checkbox
 * used to be a dead control: unchecked or checked, every session got the same
 * fixed 7-day cookie. Kept in its own module (no `server-only`/`next/headers`
 * imports, unlike `session.ts`) so the two durations are directly unit-tested
 * with no cookie/JWT mocking.
 */

/** Checked (today's default): a parent expects to stay signed in. */
export const REMEMBERED_SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Deliberately unchecked — a parent on a shared or public device expects a
 * much shorter session rather than staying signed in for a full week.
 */
export const SHORT_SESSION_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * The session/cookie lifetime for a login attempt. `rememberMe` defaults to
 * `true` at every call site that doesn't pass it, so an untouched form (the
 * checkbox defaults to checked) or any pre-existing caller keeps today's
 * 7-day duration byte-for-byte, nothing regresses for the common case.
 */
export function sessionMaxAgeSeconds(rememberMe: boolean): number {
  return rememberMe ? REMEMBERED_SESSION_SECONDS : SHORT_SESSION_SECONDS;
}
