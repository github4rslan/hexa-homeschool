import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HEXA — GCSE-ready at 14",
    short_name: "HEXA",
    description:
      "AI-powered homeschooling platform preparing UK students for GCSEs by age 14.",
    start_url: "/",
    display: "standalone",
    background_color: "#050614",
    theme_color: "#7C3AED",
    orientation: "portrait",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "productivity"],
    lang: "en-GB",
  };
}
