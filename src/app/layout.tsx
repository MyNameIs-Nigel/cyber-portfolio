import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://nigel-smith.dev"),
  title: {
    template: "%s — Nigel Smith's Portfolio",
    default: "Nigel Smith's Portfolio",
  },
  description: "Web Portfolio for Nigel Smith to showcase his skills and projects.",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Nigel Smith's Portfolio",
    description: "Web Portfolio to showcase my skills and projects.",
    siteName: "Nigel Smith's Portfolio",
    locale: "en_US",
    type: "website",
    url: "https://nigel-smith.dev",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://nigel-smith.dev/#person",
  name: "Nigel Smith",
  url: "https://nigel-smith.dev",
  jobTitle: "DevOps & Cloud Infrastructure Engineer",
  sameAs: [
    "https://github.com/mynameis-nigel",
    "https://www.linkedin.com/in/nigeld-smith/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-bg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-1"
        >
          Skip to main content
        </a>
        <Navbar />
        <div id="main-content" className="flex-1">{children}</div>
        <Footer />
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
