"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { MARKETING_JOURNEY_SEQUENCE } from "@/lib/data/navigation";

export function NextStepFunnel() {
  const pathname = usePathname();
  const currentIndex = MARKETING_JOURNEY_SEQUENCE.findIndex(
    (item) => item.href === pathname,
  );

  const next =
    currentIndex >= 0
      ? MARKETING_JOURNEY_SEQUENCE[currentIndex + 1]
      : pathname === "/" || pathname === "/for-parents" || pathname === "/local-authorities" || pathname === "/why-now"
        ? MARKETING_JOURNEY_SEQUENCE[0]
        : null;

  if (!next) return null;

  return (
    <section className="border-y border-forest-900/10 bg-linen-50/70 py-12">
      <Container>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-clay-700">
              Next step
            </p>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-forest-900">
              {next.label}
            </h2>
            {next.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
                {next.description}
              </p>
            )}
          </div>
          <Link
            href={next.href}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-forest-700 px-6 text-sm font-medium text-linen-50 transition-all hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen-100"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
