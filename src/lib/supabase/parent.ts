import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface AuthUserLike {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string | null } | null;
}

/**
 * Return the parents.id for the signed-in user, creating the parent row if it
 * doesn't exist yet.
 *
 * Why this exists: the parents row is normally created at signup, but it can be
 * missing for accounts created before that flow existed, for email-confirmed
 * signups where the insert ran without a session, or if the insert was blocked.
 * Rather than dead-ending every child/diagnostic/portfolio write with
 * "parent profile not found", we self-heal the profile here.
 *
 * Returns null only if there is genuinely no authenticated user.
 */
export async function ensureParentId(
  supabase: SupabaseServerClient,
  user: AuthUserLike,
): Promise<string | null> {
  if (!user?.id) return null;

  // Already provisioned?
  const { data: existing } = await supabase
    .from("parents")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  // Self-heal: create the missing parent row.
  const { data: created, error } = await supabase
    .from("parents")
    .insert({
      auth_user_id: user.id,
      email: user.email ?? `${user.id}@placeholder.hexa`,
      full_name: user.user_metadata?.full_name ?? null,
    } as never)
    .select("id")
    .maybeSingle();

  if (created) return (created as { id: string }).id;

  // Insert race / RLS edge: re-read once before giving up.
  if (error) {
    const { data: retry } = await supabase
      .from("parents")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (retry) return (retry as { id: string }).id;
  }

  return null;
}
