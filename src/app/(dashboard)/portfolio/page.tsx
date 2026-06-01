import type { Metadata } from "next";
import { PortfolioGenerator } from "@/components/compliance/portfolio-generator";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Compliance portfolio",
  description:
    "Generate a verified, tamper-evident Local Authority portfolio with an SHA-256 verification hash.",
};

export default function PortfolioPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-violet opacity-20 -z-10 pointer-events-none" />
      <div className="px-6 py-10 lg:px-10 lg:py-16">
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
          <BackButton fallback="/dashboard" label="Back to dashboard" className="-ml-3" />
          <a
            href="/compliance/cnis"
            className="text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Registration pre-fill →
          </a>
        </div>
        <PortfolioGenerator />
      </div>
    </div>
  );
}
