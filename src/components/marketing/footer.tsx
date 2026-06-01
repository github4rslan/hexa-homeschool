import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Container } from "@/components/ui/container";
import { FOOTER_NAV } from "@/lib/data/navigation";

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-abyss/50 py-20 mt-32">
      <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
      <Container>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 relative">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2 flex flex-col gap-5">
            <HexaLogo size={36} withText />
            <p className="text-sm leading-relaxed text-fog-400 max-w-xs">
              The AI assistant built for UK homeschooling families who want
              structure, freedom, and protection. Maths, English and Science.
            </p>
            <div className="flex flex-col gap-1.5 text-xs text-fog-500">
              <span>Hosted in the UK · AWS London (eu-west-2)</span>
              <span>AES-256 encrypted · UK GDPR compliant</span>
              <span>© {new Date().getFullYear()} HEXA Education Ltd</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fog-200 mb-4">
              Product
            </h4>
            <ul className="flex flex-col gap-3">
              {FOOTER_NAV.product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fog-400 hover:text-fog-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fog-200 mb-4">
              Trust & safety
            </h4>
            <ul className="flex flex-col gap-3">
              {FOOTER_NAV.trust.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fog-400 hover:text-fog-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fog-200 mb-4">
              Company
            </h4>
            <ul className="flex flex-col gap-3">
              {FOOTER_NAV.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fog-400 hover:text-fog-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-fog-500">
            {FOOTER_NAV.legal.map((item, i) => (
              <span key={item.href} className="flex items-center gap-4">
                {i > 0 && <span className="text-fog-700">·</span>}
                <Link
                  href={item.href}
                  className="hover:text-fog-200 transition-colors"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </div>
          <p className="text-xs text-fog-500 italic">
            "Teach with confidence. Prove with evidence. Sit when ready."
          </p>
        </div>
      </Container>
    </footer>
  );
}
