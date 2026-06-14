import { currentParentId, findParentById } from "@/lib/db/repo";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { THEME_NOFLASH_SCRIPT } from "@/components/theme/theme";

/**
 * Dashboard group layout. Mounts parents-only analytics (parent identified by
 * Mongo id, never email/name) and the theme provider for the dark/light toggle.
 * The no-flash script runs before paint so the first frame already matches the
 * saved preference. The (child) group gets NEITHER — children are never tracked
 * (Children's Code) and child mode is fixed-light.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const parentId = await currentParentId();
  // The dedicated smoke-test account is never tracked — skip analytics entirely
  // so post-deploy CI runs don't pollute PostHog product data.
  const parent = parentId ? await findParentById(parentId) : null;
  const isSmoke = parent?.is_smoke_account === true;
  return (
    <ThemeProvider>
      <script
        // Runs before hydration; sets theme-light on #hexa-workspace if needed.
        dangerouslySetInnerHTML={{ __html: THEME_NOFLASH_SCRIPT }}
      />
      {children}
      {!isSmoke && <AnalyticsProvider identifyAs={parentId} />}
    </ThemeProvider>
  );
}
