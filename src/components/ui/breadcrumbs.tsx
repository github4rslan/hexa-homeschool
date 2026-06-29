import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Compact breadcrumb trail in Edway's mono-uppercase label style.
 * The last item is rendered as the current (non-link) page.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-fog-500",
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-fog-700" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-fog-300 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-fog-300" : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
