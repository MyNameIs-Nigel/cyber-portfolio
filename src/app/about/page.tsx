import { Container } from "@/components/Container";
import { PersonalityProfile } from "@/components/PersonalityProfile";
import { QuoteBlock } from "@/components/QuoteBlock";
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
  { text: 'return "try again, he is a nerd.";', indent: 1 },
  { text: "}", indent: 0 },
];

export const metadata = {
  title: "About — Nigel Smith's Portfolio",
  description: "Nigel's about page.",
  openGraph: {
    title: "About — Nigel Smith's Portfolio",
    description: "Nigel's about page.",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 675,
      },
    ],
  },
};

const attentionSegments = [
  { label: "Building", sublabel: "Deep work", percentage: 35, accent: 1 as const },
  { label: "Learning", sublabel: "Courses + docs", percentage: 25, accent: 2 as const },
  { label: "Community", sublabel: "Mentoring", percentage: 20, accent: 3 as const },
  { label: "Exploring", sublabel: "Side quests", percentage: 20, accent: 4 as const },
];

export default function AboutPage() {
  return (
    <main>
      <Container className="py-12">
        <H1 firstOnPage>More about Nigel</H1>
        <Paragraph>
          So you made it here, congrats! I'd love to show you a little bit about me.
        </Paragraph>

        <Paragraph>
          As a cyber student, I have tons of weird interests. How surprising. But I'm a fun guy, I swear!
          This page is essentially a collection of my interests and hobbies.
        </Paragraph>
        <Paragraph muted>
          I'm not sure if you'll find this page entertaining, but I hope you do. If you have any questions, feel free to contact me.
        </Paragraph>
        <SectionDivider />

        <H2>My Hobbies</H2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Music", desc: "I love listening to music, and I'm always looking for new music to listen to.", tags: ["Metal", "Electronic", "Rock", "Pop"] },
            { title: "Coding", desc: "Yep, I like to code. I'm not always the best, but I'm getting better!", tags: ["Python", "C#", "Typescript"] },
            { title: "Photography", desc: "I love to shoot with my Sony a6700, but I shoot film too.", tags: ["Film", "Digital"] },
            { title: "Cars", desc: "I love working on, modfying, and driving cars. RIP my wallet :(", tags: ["BMW"] },
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

        <Paragraph>
          I love to shoot film and digital photography. Here are some of my favorite shots.
        </Paragraph>

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


        <SectionDivider />


        <QuoteBlock attribution="— Cursor Autocomplete, 2026">
          &ldquo;If you're not having fun, you're doing it wrong.&rdquo;
        </QuoteBlock>
      </Container>
    </main>
  );
}
