export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "How it works", href: "/how-it-works", description: "The 6-step student journey from diagnostic to GCSE entry" },
  { label: "The AI", href: "/agents", description: "Six specialised autonomous agents working in concert" },
  { label: "Live demo", href: "/demo", description: "Aisha's path to a Grade 8 — every step" },
  { label: "Safety", href: "/safety", description: "Human safety net with strict SLA-bound escalation" },
  { label: "Compliance", href: "/compliance", description: "UK GDPR, Children's Code, SHA-256 verifiable portfolios" },
  { label: "Pricing", href: "/pricing", description: "Subscription tiers and what's included" },
];

const PRODUCT_NAV: NavItem[] = [
  { label: "How it works", href: "/how-it-works", description: "The 6-step student journey from diagnostic to GCSE entry" },
  { label: "Agents", href: "/agents", description: "Six specialised autonomous agents working in concert" },
  { label: "Demo", href: "/demo", description: "Aisha's path to a Grade 8, every step" },
  { label: "Pricing", href: "/pricing", description: "Subscription tiers and what's included" },
  { label: "Gallery", href: "/gallery", description: "See the parent dashboard, child lessons and evidence flow" },
  { label: "Resources", href: "/resources", description: "Guides for home education, GCSE planning and evidence" },
  { label: "Roadmap", href: "/roadmap", description: "What is live now and what is coming next" },
];

const TRUST_NAV: NavItem[] = [
  { label: "Safety", href: "/safety", description: "Human safety net with strict SLA-bound escalation" },
  { label: "Compliance", href: "/compliance", description: "UK GDPR, audit trails and verified portfolios" },
  { label: "Children's Code", href: "/childrens-code", description: "Age-appropriate design for child-mode learning" },
];

const AUDIENCE_NAV: NavItem[] = [
  { label: "For parents", href: "/for-parents", description: "What daily learning and oversight look like at home" },
  { label: "Local authorities", href: "/local-authorities", description: "Clear evidence packs for CNIS and LA conversations" },
  { label: "Why now", href: "/why-now", description: "Why AI-supported home education is possible now" },
];

export const MARKETING_NAV_GROUPS: NavGroup[] = [
  { label: "Product", items: PRODUCT_NAV },
  { label: "Trust", items: TRUST_NAV },
  { label: "Who it's for", items: AUDIENCE_NAV },
];

export const MARKETING_JOURNEY_SEQUENCE: NavItem[] = [
  { label: "Understand the journey", href: "/how-it-works", description: "Start with the six steps from diagnostic to GCSE entry." },
  { label: "Meet the agents", href: "/agents", description: "See how Edway plans, teaches, checks and proves progress." },
  { label: "Watch the demo", href: "/demo", description: "Follow a realistic student path through the platform." },
  { label: "Check safety", href: "/safety", description: "Review the safeguards behind child-mode learning." },
  { label: "Review compliance", href: "/compliance", description: "See how evidence, audit trails and portfolios are produced." },
  { label: "Compare pricing", href: "/pricing", description: "Choose the plan that fits your family." },
  { label: "Start assessment", href: "/signup", description: "Create an account and begin the free assessment." },
];

export const FOOTER_NAV = {
  product: [
    { label: "How it works", href: "/how-it-works" },
    { label: "The AI agents", href: "/agents" },
    { label: "Live demo", href: "/demo" },
    { label: "Pricing", href: "/pricing" },
    { label: "Gallery", href: "/gallery" },
    { label: "Resources", href: "/resources" },
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
    { label: "About Edway", href: "/about" },
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
