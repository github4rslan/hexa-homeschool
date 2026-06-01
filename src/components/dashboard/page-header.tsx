import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";

/**
 * Shared header for dashboard sub-pages: back button + breadcrumb trail +
 * title/description, with an optional right-aligned action slot.
 * One component so navigation is consistent on every page (req: back buttons
 * + coherent navigation everywhere).
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  backFallback = "/dashboard",
  backLabel = "Back",
  action,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  backFallback?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <BackButton fallback={backFallback} label={backLabel} className="-ml-3" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} />
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-fog-50">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-fog-400 max-w-2xl">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
