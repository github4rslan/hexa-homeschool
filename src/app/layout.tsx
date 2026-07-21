import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { PWARegister } from "@/components/pwa/pwa-register";

// Editorial serif for the warm marketing theme — heritage, high-trust,
// "clean editorial typography" per the web brief. Used for marketing display
// headings via the `.theme-warm` scope; the app/child/admin keep Geist.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Edway — Teach with confidence. Prove with evidence. Sit when ready.",
    template: "%s · Edway",
  },
  description:
    "Edway is the AI assistant built for UK homeschooling families. It plans your child's learning, teaches daily lessons in Maths, English and Science, tracks every step, and generates the Local Authority-compliant evidence you need — all in one place. Not rushed. Not forced. Sit when ready.",
  applicationName: "Edway",
  keywords: [
    "GCSE",
    "early GCSE",
    "homeschooling UK",
    "AI tutor",
    "elective home education",
    "Local Authority compliance",
    "Mathematics GCSE",
    "English GCSE",
    "Science GCSE",
    "Children's Code",
  ],
  authors: [{ name: "Edway Education Ltd" }],
  creator: "Edway",
  publisher: "Edway Education Ltd",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: "Edway",
    title: "Edway — Teach with confidence. Prove with evidence. Sit when ready.",
    description:
      "The AI assistant built for UK homeschooling families. Daily lessons, transparent progress tracking, and Local Authority-compliant portfolios. Full Local Authority compliance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Edway — Teach with confidence. Prove with evidence. Sit when ready.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Edway — Teach with confidence. Prove with evidence. Sit when ready.",
    description:
      "The AI assistant built for UK homeschooling families. Daily lessons, progress tracking, and council-ready evidence.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050614" },
    { media: "(prefers-color-scheme: light)", color: "#050614" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased selection:bg-violet-600 selection:text-white">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
