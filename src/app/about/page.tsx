import { Banner } from "@/components/Banner";
import { Container } from "@/components/Container";
import { PersonalityProfile } from "@/components/PersonalityProfile";
import { SectionDivider } from "@/components/SectionDivider";
import { StatBar } from "@/components/StatBar";
import { H1, H2, H3, Paragraph } from "@/components/Typography";
import { CardGrid } from "@/components/cards/CardGrid";
import { MediaCard } from "@/components/cards/MediaCard";
import { musicRotation, photoShowcase } from "@/data/media";
import { personalitySample } from "@/data/personality";
import { CodeSnippet } from "@/components/CodeSnippet";
import { PhotoCard } from "@/components/cards/PhotoCard";

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
      <Container className="py-12">
        <H1 firstOnPage>More about Nigel</H1>
        <Paragraph>
          This is the less résumé-shaped part of the site: what I listen to, what I shoot, and what I do when I&apos;m away from a cloud console.
        </Paragraph>

        <div className="mt-6">
          <Banner src="/hero.jpg" quote="Nigel Smith — shot on Kodak Ektachrome 100" />
        </div>

        <SectionDivider />

        <H2>My Hobbies</H2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Music", desc: "My rotation moves between metal, electronic, rock, and pop.", tags: ["Metal", "Electronic", "Rock", "Pop"] },
            { title: "Coding", desc: "Most of my side projects start as an excuse to learn one unfamiliar thing.", tags: ["Python", "C#", "TypeScript"] },
            { title: "Photography", desc: "I carry a Sony a6700 most often, but I still shoot film when I can.", tags: ["Film", "Digital"] },
            { title: "Cars", desc: "I like working on, modifying, and driving cars. My wallet likes this less.", tags: ["BMW"] },
          ].map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-accent-1/50">
              <h3 className="text-base font-semibold text-fg">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent-1/10 px-2.5 py-1 text-xs text-accent-1">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SectionDivider />

        <H3>(Some of) My Favorite Albums</H3>
        <div className="mt-4">
          <CardGrid columns={2} gap="md">
            {musicRotation.map((m) => (
              <MediaCard key={m.title} {...m} />
            ))}
          </CardGrid>
        </div>

        <SectionDivider />

        <H2>Personality</H2>
        <div className="mt-4">
          <PersonalityProfile {...personalitySample} />
        </div>

        <SectionDivider />

        <H2>Some of my favorite Shots</H2>

        <CardGrid columns={2} gap="md">
            {photoShowcase.map((p, i) => (
              <PhotoCard key={i} {...p} />
            ))}
          </CardGrid>

        <Paragraph muted className="pt-4">
          For full size photos, check out my Flickr page, or my ndsironwood.com portfolio.
        </Paragraph>

        <SectionDivider />

        <CodeSnippet filename="nigel.ts" theme="(Dark Mode)" lines={codeLines} />

        <SectionDivider />

        <H2>Where all my time goes...</H2>
        <div className="mt-4">
          <StatBar segments={attentionSegments} />
        </div>
      </Container>
    </main>
  );
}
