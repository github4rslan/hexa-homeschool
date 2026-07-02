"use client";

import { useState } from "react";
import { Settings, Sparkles, Volume2, Shield } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { IllustrativeNote } from "@/components/admin/illustrative";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Flag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout: number;
  category: "ai" | "ui" | "experimental" | "safety";
}

const INITIAL_FLAGS: Flag[] = [
  { key: "agent.teaching.rag_v2", label: "Teaching Agent · RAG v2", description: "New retrieval pipeline with multi-vector search", enabled: true, rollout: 100, category: "ai" },
  { key: "agent.assessment.long_form_grading", label: "Assessment · long-form GPT-4 grading", description: "Use GPT-4 for English essay grading vs. heuristic", enabled: true, rollout: 100, category: "ai" },
  { key: "ui.dashboard.live_activity_stream", label: "Dashboard · live activity stream", description: "Real-time SSE feed in parent dashboard", enabled: true, rollout: 75, category: "ui" },
  { key: "voice.elevenlabs.v2_5_flash", label: "ElevenLabs · Flash v2.5 voices", description: "Lower latency model for streaming narration", enabled: true, rollout: 50, category: "ai" },
  { key: "ui.parent.mobile_app_promo", label: "Mobile app announcement banner", description: "Show 'iOS app coming soon' banner in dashboard", enabled: false, rollout: 0, category: "ui" },
  { key: "safety.distress.expanded_vectors", label: "Distress vectors · expanded keywords", description: "Add 18 new distress patterns to detection model", enabled: true, rollout: 100, category: "safety" },
  { key: "experimental.peer_compare", label: "Peer comparison view", description: "Anonymous percentile rank vs. cohort", enabled: false, rollout: 0, category: "experimental" },
];

const categoryColor = {
  ai: { bg: "bg-violet-500/10", border: "border-violet-400/30", text: "text-violet-300", icon: Sparkles },
  ui: { bg: "bg-cyan-500/10", border: "border-cyan-400/30", text: "text-cyan-400", icon: Settings },
  experimental: { bg: "bg-amber-500/10", border: "border-amber-400/30", text: "text-amber-400", icon: Volume2 },
  safety: { bg: "bg-crimson-500/10", border: "border-crimson-400/30", text: "text-crimson-400", icon: Shield },
};

export default function SettingsPage() {
  const [flags, setFlags] = useState(INITIAL_FLAGS);

  function toggle(key: string) {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled, rollout: !f.enabled ? 100 : 0 } : f)),
    );
  }

  function setRollout(key: string, rollout: number) {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, rollout } : f)));
  }

  return (
    <>
      <AdminTopbar
        title="Feature Flags & System Settings"
        subtitle="Runtime toggles for AI behaviours, UI features, and safety controls"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <IllustrativeNote className="mb-6">
          These flags are a UI placeholder — they are not wired to runtime
          behaviour and toggling them changes nothing in production. The only
          live feature gate today is the <code className="font-mono">AI_VISUALS_ENABLED</code>{" "}
          environment variable. A real feature-flag store is a later-phase item
          (see docs/METRICS.md).
        </IllustrativeNote>
        <div className="flex flex-col gap-3">
          {flags.map((f) => {
            const c = categoryColor[f.category];
            const Icon = c.icon;
            return (
              <Card key={f.key} variant="glass" padding="lg">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${c.bg} ${c.border}`}>
                    <Icon className={`h-4 w-4 ${c.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-fog-50">{f.label}</h3>
                      <Badge variant="outline" size="sm">
                        {f.category}
                      </Badge>
                      <code className="text-[10px] font-mono text-fog-500 bg-white/[0.03] rounded px-1.5 py-0.5">
                        {f.key}
                      </code>
                    </div>
                    <p className="text-xs text-fog-400 mt-1.5">{f.description}</p>

                    {f.enabled && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-fog-500">Rollout</span>
                          <span className="font-mono font-semibold text-fog-200 tabular-nums">{f.rollout}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={f.rollout}
                          onChange={(e) => setRollout(f.key, parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500 bg-white/5"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggle(f.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      f.enabled ? "bg-violet-500" : "bg-white/10"
                    }`}
                    role="switch"
                    aria-checked={f.enabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        f.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
