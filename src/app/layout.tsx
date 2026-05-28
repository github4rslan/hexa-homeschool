import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "HEXA — GCSE-ready at 14. With proof.",
    template: "%s · HEXA",
  },
  description:
    "HEXA is an AI-powered homeschooling platform preparing UK students for GCSE Mathematics, English and Science by age 14 — two years ahead of the traditional academic timeline. Six specialised AI agents. Full Local Authority compliance. Built in the UK.",
  applicationName: "HEXA",
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
  authors: [{ name: "HEXA Education Ltd" }],
  creator: "HEXA",
  publisher: "HEXA Education Ltd",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://hexa.education",
    siteName: "HEXA",
    title: "HEXA — GCSE-ready at 14. With proof.",
    description:
      "Six specialised AI agents preparing UK students for GCSEs two years early. Full Local Authority compliance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HEXA — GCSE-ready at 14. With proof.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HEXA — GCSE-ready at 14. With proof.",
    description:
      "Six specialised AI agents preparing UK students for GCSEs two years early.",
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
  alternates: { canonical: "https://hexa.education" },
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased selection:bg-violet-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
