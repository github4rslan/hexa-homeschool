import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { CTA } from "@/components/marketing/cta";
import { listMedia } from "@/lib/db/repo";
import { cloudinaryThumb } from "@/lib/media/cloudinary";

export const metadata: Metadata = {
  title: "Success gallery",
  description:
    "Real moments from UK homeschooling families learning with HEXA.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const media = await listMedia({ useCase: "marketing", publicOnly: true, limit: 60 });

  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Success gallery"
          title={
            <>
              Real families.
              <br />
              <span className="text-gradient-aurora">Real learning.</span>
            </>
          }
          description="A growing gallery of moments from UK homeschooling families on HEXA."
        />
      </Section>

      <Section padded={false} className="pb-20">
        {media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((m) => (
              <div
                key={m._id?.toHexString()}
                className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryThumb(m.secure_url, 600)}
                  alt="HEXA family moment"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <Card variant="glass" padding="xl" className="text-center">
            <h3 className="text-xl font-semibold text-fog-50 mb-2">
              Gallery coming soon
            </h3>
            <p className="text-sm text-fog-400 max-w-md mx-auto">
              We&apos;re collecting consented photos and stories from families on
              HEXA. Check back shortly — or start your own journey today.
            </p>
          </Card>
        )}
      </Section>

      <CTA />
    </>
  );
}
