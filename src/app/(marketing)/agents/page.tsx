import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { AgentDetails } from "@/components/marketing/agent-detail";
import { AgentNetwork } from "@/components/marketing/agent-network";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "The AI agents",
  description:
    "Six specialised autonomous agents with checker validators and a Meta Checker supervisor — the multi-agent architecture powering Edway.",
};

export default function AgentsPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          as="h1"
          eyebrow="Multi-Agent Architecture"
          title={
            <>
              Six agents.
              <br />
              <span className="text-gradient-violet">Each with a checker.</span>
              <br />
              One Meta Checker watching them all.
            </>
          }
          description="Edway runs on a strictly decoupled multi-agent architecture. Every output passes through a checker validator. Every transaction is sampled by the Meta Checker. Human operators only intervene when SLA-bound triggers fire."
        />
      </Section>

      <Section padded={false} className="pb-20">
        <AgentNetwork />
      </Section>

      <Section padded className="pt-20">
        <SectionHeader
          eyebrow="Agent Spec Sheets"
          title="Inside every agent"
          description="Click each agent to inspect its ingested parameters, internal logic loop, and checker validator role."
        />
      </Section>
      <Section padded={false} className="pb-32">
        <AgentDetails />
      </Section>
      <CTA />
    </>
  );
}
