import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Container } from "@/components/ui/container";
import { Newsletter } from "@/components/marketing/newsletter";
import { FOOTER_NAV } from "@/lib/data/navigation";

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-forest-900/10 bg-forest-900 text-linen-100 py-20 mt-32">
      <Container>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 relative">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <HexaLogo size={36} />
              <div className="leading-tight">
                <div className="font-editorial text-xl font-semibold text-linen-50">
                  HEXA
                </div>
                <div className="text-[11px] uppercase tracking-wider text-forest-200">
                  Home Education Expert Assistant
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-forest-100/80 max-w-xs italic font-editorial">
              Teach with confidence. Prove with evidence. Sit when ready.
            </p>
            <div className="max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-100 mb-2">
                Join two thousand plus UK homeschooling parents for weekly tips
                and early access.
              </p>
              <Newsletter source="footer" />
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-forest-200/70">
              <span>hello@edway.uk</span>
              <span>
                © {new Date().getFullYear()} HEXA Education Ltd. UK GDPR
                compliant. Children&apos;s Code certified. AWS London.
              </span>
            </div>
          </div>

          <FooterColumn title="Product" items={FOOTER_NAV.product} />
          <FooterColumn title="Trust & safety" items={FOOTER_NAV.trust} />
          <FooterColumn title="Company" items={FOOTER_NAV.company} />
        </div>

        <div className="mt-16 pt-8 border-t border-forest-100/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-forest-200/70">
            {FOOTER_NAV.legal.map((item, i) => (
              <span key={item.href} className="flex items-center gap-4">
                {i > 0 && <span className="text-forest-100/30">·</span>}
                <Link
                  href={item.href}
                  className="hover:text-linen-50 transition-colors"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </div>
          <p className="text-xs text-forest-200/60">
            Aligned with the Children&apos;s Wellbeing and Schools Act 2026.
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-forest-100 mb-4">
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-forest-200/80 hover:text-linen-50 transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
