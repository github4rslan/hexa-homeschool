export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "How it works", href: "/how-it-works", description: "The 6-step student journey from diagnostic to GCSE entry" },
  { label: "The AI", href: "/agents", description: "Six specialised autonomous agents working in concert" },
  { label: "Live demo", href: "/demo", description: "Aisha's path to a Grade 8 — every step" },
  { label: "Safety", href: "/safety", description: "Human safety net with strict SLA-bound escalation" },
  { label: "Compliance", href: "/compliance", description: "UK GDPR, Children's Code, SHA-256 verifiable portfolios" },
  { label: "Pricing", href: "/pricing", description: "Subscription tiers and what's included" },
];

export const FOOTER_NAV = {
  product: [
    { label: "How it works", href: "/how-it-works" },
    { label: "The AI agents", href: "/agents" },
    { label: "Live demo", href: "/demo" },
    { label: "Pricing", href: "/pricing" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  trust: [
    { label: "Safety net", href: "/safety" },
    { label: "Compliance", href: "/compliance" },
    { label: "Children's Code", href: "/childrens-code" },
    { label: "Privacy", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
  ],
  company: [
    { label: "About HEXA", href: "/about" },
    { label: "Why now", href: "/why-now" },
    { label: "For Parents", href: "/for-parents" },
    { label: "For Local Authorities", href: "/local-authorities" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookies", href: "/cookies" },
  ],
};
