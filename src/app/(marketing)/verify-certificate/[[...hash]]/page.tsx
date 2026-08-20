import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { VerifyCertificate } from "@/components/marketing/verify-certificate";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";
import { buildPageMetadata } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  path: "/verify-certificate",
  title: "Verify a certificate",
  description:
    "Confirm the authenticity of an Edway mastery certificate. Paste the certificate's SHA-256 verification code to check it against our tamper-evident record.",
});

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ hash?: string[] }>;
}) {
  const { hash } = await params;
  const initialHash = hash?.[0];

  return (
    <>
      <BreadcrumbJsonLd
        items={[{ name: "Verify a certificate", path: "/verify-certificate" }]}
      />
      <Section padded className="pt-16">
        <SectionHeader
          as="h1"
          eyebrow="Verified evidence"
          title={
            <>
              Verify a<br />
              <span className="text-gradient-violet">mastery certificate.</span>
            </>
          }
          description="Every Edway mastery certificate carries a tamper-evident SHA-256 code. Paste it below to confirm the certificate is authentic and see the facts it records — nothing more."
        />

        <div className="mx-auto mt-2 max-w-2xl">
          <VerifyCertificate initialHash={initialHash} />

          <p className="mt-8 text-xs leading-relaxed text-fog-500">
            This check reveals only what is already printed on the certificate:
            the child's first name, the topic, the subject and the award date. No
            other information is stored or shown, and no account is required.
          </p>
        </div>
      </Section>
    </>
  );
}
