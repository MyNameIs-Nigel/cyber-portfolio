import { CodeSnippet } from "@/components/CodeSnippet";
import { H2 } from "@/components/Typography";
import { personalitySample } from "@/data/personality";
import { ConstellationSky } from "@/features/constellations/ConstellationSky";

const codeLines = [
  { text: 'export function nigelsmith() {', indent: 0 },
  { text: 'if (nigel == nerd) {', indent: 1, annotation: "HAH, NERD!" },
  { text: 'return "do you really need to ask?";', indent: 2 },
  { text: "}", indent: 1 },
  { text: 'else {', indent: 1 },
  { text: 'return "try again, he is a nerd.";', indent: 2 },
  { text: '}', indent: 1 },
  { text: "}", indent: 0 },
];

export const metadata = {
  title: "About",
  description: "Nigel Smith's photography, music, side projects, and other interests.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Nigel Smith's Portfolio",
    description: "Nigel Smith's photography, music, side projects, and other interests.",
    siteName: "Nigel Smith's Portfolio",
    locale: "en_US",
    type: "website",
    url: "https://nigel-smith.dev/about",
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

const attentionSegments = [
  { label: "Building", sublabel: "Code, photos, and side projects", percentage: 56, accent: 1 as const },
  { label: "Sleeping", percentage: 3, accent: 2 as const },
  { label: "Friends", percentage: 19, accent: 3 as const },
  { label: "Trying new things", percentage: 22, accent: 4 as const },
];

export default function AboutPage() {
  return (
    <main>
      {/*
        Full-bleed and pinned: the sky scrolls under a fixed view, so it sits
        outside Container. It carries the page heading and the four hobbies.
      */}
      <ConstellationSky />

    </main>
  );
}
