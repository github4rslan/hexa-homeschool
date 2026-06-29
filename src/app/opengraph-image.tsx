import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";

export const runtime = "edge";
export const alt = "Edway — GCSE-ready at 14. With proof.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#050614",
          backgroundImage:
            "radial-gradient(at 20% 10%, rgba(124, 58, 237, 0.35), transparent 50%), radial-gradient(at 80% 0%, rgba(0, 212, 255, 0.2), transparent 50%), radial-gradient(at 90% 90%, rgba(6, 255, 165, 0.15), transparent 50%)",
          fontFamily: "system-ui, sans-serif",
          color: "#FAFAFC",
          position: "relative",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="og-grad" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#00D4FF" />
              </linearGradient>
            </defs>
            <path
              d="M24 3L42.4 13.5V34.5L24 45L5.6 34.5V13.5L24 3Z"
              stroke="url(#og-grad)"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="24" cy="24" r="3" fill="#06FFA5" />
          </svg>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Edway
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 112,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
            }}
          >
            <span>GCSE-ready</span>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #06FFA5 0%, #00D4FF 50%, #A78BFA 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              at 14.
            </span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#B8BAD0",
              fontWeight: 400,
            }}
          >
            With proof. Six AI agents. Built in the UK.
          </div>
        </div>

        {/* Footer badges */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            fontSize: 18,
            color: "#8A8DAB",
          }}
        >
          <span>UK GDPR · Children's Code · AWS London</span>
          <span>•</span>
          <span style={{ color: "#C4B5FD" }}>{SITE_HOST}</span>
        </div>
      </div>
    ),
    size,
  );
}
