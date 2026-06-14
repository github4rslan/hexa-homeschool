/**
 * Birthday helpers — pure date logic, no DB. A child's birthday is matched on
 * month + day against "today" (local), so it lights up once a year regardless
 * of birth year. Used for the gentle parent banner and the child-mode greeting.
 */

/** Is `dob` (ISO date) the same month/day as `now`? */
export function isBirthdayToday(dob: string, now: Date = new Date()): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** Age turning today (for the banner), or null when not a birthday. */
export function birthdayAge(dob: string, now: Date = new Date()): number | null {
  if (!isBirthdayToday(dob, now)) return null;
  const d = new Date(dob);
  return now.getFullYear() - d.getFullYear();
}
