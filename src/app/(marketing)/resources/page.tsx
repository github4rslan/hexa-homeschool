import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { CTA } from "@/components/marketing/cta";
import { listMedia } from "@/lib/db/repo";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  path: "/resources",
  title: "Resources",
  description:
    "Free guides and downloads for UK homeschooling families — Local Authority help, sample portfolios and more.",
});

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await listMedia({ useCase: "resource", publicOnly: true, limit: 60 });

  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          as="h1"
          eyebrow="Resources"
          title={
            <>
              Free guides for
              <br />
              <span className="text-gradient-violet">homeschooling families.</span>
            </>
          }
          description="Practical downloads on Local Authority compliance, sample portfolios, and getting started — no sign-up required."
        />
      </Section>

      <Section padded={false} className="pb-20">
        {resources.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {resources.map((r) => (
              <a
                key={r._id?.toHexString()}
                href={r.secure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card variant="glass" padding="lg" interactive className="h-full">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
                      <FileText className="h-5 w-5 text-violet-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-fog-50">
                        {r.meta?.title ?? r.public_id.split("/").pop()}
                      </h3>
                      <p className="text-xs text-fog-500">Download</p>
                    </div>
                    <Download className="h-5 w-5 text-fog-400 group-hover:text-fog-200 transition-colors" />
                  </div>
                </Card>
              </a>
            ))}
          </div>
        ) : (
          <Card variant="glass" padding="xl" className="text-center">
            <h3 className="text-xl font-semibold text-fog-50 mb-2">
              Resources coming soon
            </h3>
            <p className="text-sm text-fog-400 max-w-md mx-auto">
              We&apos;re preparing free guides on Local Authority compliance and
              sample portfolios. Join our newsletter to be the first to get them.
            </p>
          </Card>
        )}
      </Section>

      <CTA />
    </>
  );
}
