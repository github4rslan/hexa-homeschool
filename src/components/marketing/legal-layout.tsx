import { Container } from "@/components/ui/container";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: React.ReactNode;
}

/**
 * Shared layout for static legal pages.
 * Provides a clean reading experience with a sidebar TOC slot.
 */
export function LegalLayout({
  title,
  lastUpdated,
  intro,
  children,
}: LegalLayoutProps) {
  return (
    <div className="relative pt-16 pb-32">
      <Container size="md">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/5 px-3 py-1 text-xs font-mono uppercase tracking-widest text-violet-300 mb-6">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-fog-50 mb-4">
            {title}
          </h1>
          <p className="text-sm text-fog-500 font-mono uppercase tracking-wider">
            Last updated: {lastUpdated}
          </p>
          {intro && (
            <p className="mt-6 text-lg text-fog-300 leading-relaxed">{intro}</p>
          )}
        </div>

        <div className="prose prose-invert prose-violet max-w-none
          [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fog-50 [&_h2]:mt-16 [&_h2]:mb-4 [&_h2]:scroll-mt-32
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-fog-100 [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-fog-300 [&_p]:mb-4
          [&_ul]:text-base [&_ul]:leading-relaxed [&_ul]:text-fog-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
          [&_li]:mb-2
          [&_a]:text-violet-300 [&_a:hover]:text-violet-200 [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:text-fog-100 [&_strong]:font-semibold">
          {children}
        </div>
      </Container>
    </div>
  );
}
