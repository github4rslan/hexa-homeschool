import type { Metadata } from "next";
import { PortfolioGenerator } from "@/components/compliance/portfolio-generator";

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
        <PortfolioGenerator />
      </div>
    </div>
  );
}
