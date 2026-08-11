"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * A schematic "live system" diagram showing the multi-agent architecture
 * with animated data packets flowing between layers.
 *
 * Layers (top → bottom):
 *   Client → API Gateway → Orchestration → Workers + Checkers → Meta Checker → Data
 */

interface Layer {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  glow: string;
}

const LAYERS: Layer[] = [
  { id: "client", label: "Client Layer", sublabel: "Next.js · React Native", color: "#A78BFA", glow: "rgba(167,139,250,0.4)" },
  { id: "gateway", label: "API Gateway", sublabel: "Session · Rate Limit · Routing", color: "#22D3EE", glow: "rgba(34,211,238,0.4)" },
  { id: "orchestration", label: "Orchestration", sublabel: "LangChain / CrewAI Router", color: "#06FFA5", glow: "rgba(6,255,165,0.4)" },
];

const WORKERS = [
  { id: "teaching", label: "Teaching", color: "#A78BFA" },
  { id: "assessment", label: "Assessment", color: "#06FFA5" },
  { id: "compliance", label: "Compliance", color: "#F87171" },
];

const CHECKERS = [
  { id: "teacher-check", label: "Teacher Check", color: "#A78BFA" },
  { id: "assess-check", label: "Assess Check", color: "#06FFA5" },
  { id: "comp-check", label: "Comp Check", color: "#F87171" },
];

export function AgentNetwork() {
  const [pulses, setPulses] = useState<number[]>([]);

  useEffect(() => {
    const tick = setInterval(() => {
      setPulses((p) => [...p.slice(-4), Date.now()]);
    }, 1500);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Live indicator */}
      <div className="absolute -top-4 right-0 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neon-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-400" />
        </span>
        <span>System Live</span>
      </div>

      <div className="relative glass-strong rounded-3xl p-10 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-fine opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col gap-8">
          {/* Top three layers */}
          {LAYERS.map((layer, i) => (
            <LayerRow key={layer.id} layer={layer} index={i} />
          ))}

          {/* Workers + checkers grid */}
          <div className="grid grid-cols-3 gap-6">
            {WORKERS.map((w, i) => (
              <m.div
                key={w.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex flex-col gap-3"
              >
                <div
                  className="relative rounded-xl border bg-black/30 backdrop-blur-sm px-4 py-3 text-center"
                  style={{ borderColor: `${w.color}30`, boxShadow: `0 0 30px -15px ${w.color}` }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-widest mb-1"
                    style={{ color: w.color }}
                  >
                    Worker
                  </div>
                  <div className="text-sm font-semibold text-fog-50">{w.label}</div>
                  <span
                    className="absolute -top-1 -right-1 h-2 w-2 rounded-full animate-pulse"
                    style={{ background: w.color }}
                  />
                </div>
                {/* Connector */}
                <div className="flex justify-center">
                  <div
                    className="w-px h-6"
                    style={{ background: `linear-gradient(to bottom, ${w.color}80, transparent)` }}
                  />
                </div>
                <div
                  className="rounded-xl border bg-amber-500/5 backdrop-blur-sm px-4 py-3 text-center border-amber-400/30"
                  style={{ boxShadow: "0 0 20px -10px rgba(251,191,36,0.4)" }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1 text-amber-400">
                    Checker
                  </div>
                  <div className="text-xs font-semibold text-fog-100">
                    {CHECKERS[i].label}
                  </div>
                </div>
              </m.div>
            ))}
          </div>

          {/* Connecting line down to meta checker */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-gradient-to-b from-amber-400/40 to-transparent" />
          </div>

          {/* Meta Checker */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="relative rounded-2xl border border-violet-400/40 bg-violet-500/10 backdrop-blur-sm px-6 py-4 overflow-hidden"
            style={{ boxShadow: "0 0 40px -10px rgba(124,58,237,0.4)" }}
          >
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
            <div className="flex items-center justify-between relative">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300 mb-1">
                  Meta Checker · 5% audit sampling
                </div>
                <div className="text-base font-semibold text-fog-50">
                  Systemic Drift Analysis & Cross-Agent Validation
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-2xl font-mono font-semibold text-gradient-aurora">
                  98.2%
                </div>
                <div className="text-[10px] text-fog-500 uppercase tracking-widest">
                  Confidence
                </div>
              </div>
            </div>
          </m.div>

          {/* Connector to data */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-gradient-to-b from-violet-400/40 to-transparent" />
          </div>

          {/* Data layer */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: "PostgreSQL", sublabel: "Structured Core", color: "#A78BFA" },
              { label: "Redis", sublabel: "State / Cache", color: "#F87171" },
              { label: "pgvector", sublabel: "RAG Embeddings", color: "#06FFA5" },
            ].map((d) => (
              <div
                key={d.label}
                className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm px-4 py-3 text-center"
              >
                <div
                  className="text-sm font-mono font-semibold"
                  style={{ color: d.color }}
                >
                  {d.label}
                </div>
                <div className="text-[10px] text-fog-500 uppercase tracking-widest mt-0.5">
                  {d.sublabel}
                </div>
              </div>
            ))}
          </m.div>
        </div>

        {/* Live event ticker overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-fog-500 uppercase tracking-widest border-t border-white/5 pt-2 mt-4">
          <span>
            <span className="animate-blink text-neon-400">●</span> Audit transaction #{pulses.length} processed
          </span>
          <span>tls 1.3 · aes-256 · uk · london</span>
        </div>
      </div>
    </div>
  );
}

function LayerRow({ layer, index }: { layer: Layer; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative rounded-xl border bg-black/30 backdrop-blur-sm px-5 py-3 flex items-center justify-between"
      style={{
        borderColor: `${layer.color}30`,
        boxShadow: `0 0 30px -15px ${layer.glow}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ background: layer.color, boxShadow: `0 0 12px ${layer.color}` }}
        />
        <div>
          <div className="text-sm font-semibold text-fog-50">{layer.label}</div>
          {layer.sublabel && (
            <div className="text-[10px] font-mono uppercase tracking-wider text-fog-500">
              {layer.sublabel}
            </div>
          )}
        </div>
      </div>
      <div className="text-[10px] font-mono text-fog-500">
        L{String(index + 1).padStart(2, "0")}
      </div>
      {/* Packet animation */}
      <m.div
        className="absolute left-1/2 -bottom-3 h-2 w-2 rounded-full"
        style={{ background: layer.color, boxShadow: `0 0 10px ${layer.color}` }}
        animate={{
          opacity: [0, 1, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: index * 0.5,
          ease: "easeInOut",
        }}
      />
    </m.div>
  );
}
