import type { ReactNode } from "react";
import { AccentList } from "@/components/AccentList";
import { Banner } from "@/components/Banner";
import { CodeSnippet } from "@/components/CodeSnippet";
import { ConsoleLog } from "@/components/ConsoleLog";
import { Container } from "@/components/Container";
import { DevLoop } from "@/components/DevLoop";
import { Kanban } from "@/components/Kanban";
import { PersonalityProfile } from "@/components/PersonalityProfile";
import { PlusMinus } from "@/components/PlusMinus";
import { QuoteBlock } from "@/components/QuoteBlock";
import { Roadmap } from "@/components/Roadmap";
import { SectionDivider } from "@/components/SectionDivider";
import { StatBar } from "@/components/StatBar";
import { Terminal } from "@/components/Terminal";
import { ToolCard } from "@/components/ToolCard";
import { ValueCard } from "@/components/ValueCard";
import { H1, H2, H3, H4, Paragraph } from "@/components/Typography";
import { CardGrid } from "@/components/cards/CardGrid";
import { MediaCard } from "@/components/cards/MediaCard";
import { PhotoCard } from "@/components/cards/PhotoCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { thoughtLogMessages, thoughtLogTitle } from "@/data/consoleLogs";
import { kanbanColumns } from "@/data/kanban";
import { mediaShowcase, photoShowcase } from "@/data/media";
import { personalitySample } from "@/data/personality";
import { projects } from "@/data/projects";
import { roadmapSections } from "@/data/roadmap";
import { terminalHeaders, terminalInput, terminalRows, terminalTitle } from "@/data/terminal";
import { toolbox } from "@/data/tools";
import { valueCards } from "@/data/values";

const bannerSrc = "https://placehold.co/1200x514/141414/737373?text=BANNER";

const codeLines = [
  { text: 'export function excellence() {', indent: 0 },
  { text: 'if (quality < threshold) {', indent: 1, annotation: "Same-line brace (1TBS)" },
  { text: 'return "iterate";', indent: 2 },
  { text: "}", indent: 1 },
  { text: 'return "ship";', indent: 1 },
  { text: "}", indent: 0 },
];

function Showcase({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className="mb-16">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">Component: {name}</p>
      {children}
    </section>
  );
}

export default function TemplatePage() {
  return (
    <main>
      <Container className="py-12">
        <Showcase name="Typography — H1">
          <H1 firstOnPage>Heading One</H1>
        </Showcase>
        <Showcase name="Typography — H2">
          <H2>Heading Two</H2>
        </Showcase>
        <Showcase name="Typography — H3">
          <H3>Heading Three</H3>
        </Showcase>
        <Showcase name="Typography — H4">
          <H4>Heading Four</H4>
        </Showcase>
        <Showcase name="Typography — Paragraph">
          <Paragraph>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Paragraph>
          <Paragraph muted>Muted paragraph — secondary copy for captions and supporting text.</Paragraph>
        </Showcase>

        <Showcase name="AccentList">
          <AccentList accent={1} items={["Lorem ipsum dolor", "Sit amet consectetur", "Adipiscing elit sed"]} />
          <div className="mt-6">
            <AccentList accent={2} items={["Second accent bullets", "Orange highlights", "For variety"]} />
          </div>
          <div className="mt-6">
            <AccentList accent={3} items={["Third accent bullets", "Violet highlights", "Tertiary callouts"]} />
          </div>
          <div className="mt-6">
            <AccentList accent={4} items={["Fourth accent bullets", "Blue highlights", "Quaternary callouts"]} />
          </div>
        </Showcase>

        <Showcase name="MediaCard grid">
          <CardGrid columns={2} gap="md">
            {mediaShowcase.map((m) => (
              <MediaCard key={m.title} {...m} />
            ))}
          </CardGrid>
        </Showcase>

        <Showcase name="ProjectCard">
          <div className="space-y-3">
            {projects.slice(0, 2).map((p) => (
              <ProjectCard key={p.title} {...p} />
            ))}
          </div>
        </Showcase>

        <Showcase name="PhotoCard">
          <CardGrid columns={2} gap="md">
            {photoShowcase.map((p, i) => (
              <PhotoCard key={i} {...p} />
            ))}
          </CardGrid>
        </Showcase>

        <Showcase name="Terminal">
          <Terminal title={terminalTitle} columnHeaders={terminalHeaders} rows={terminalRows} input={terminalInput} />
        </Showcase>

        <Showcase name="ConsoleLog">
          <ConsoleLog title={thoughtLogTitle} messages={thoughtLogMessages} />
        </Showcase>

        <Showcase name="Roadmap">
          <Roadmap sections={roadmapSections} />
        </Showcase>

        <Showcase name="StatBar">
          <StatBar
            segments={[
              { label: "Deep work", percentage: 40, accent: 1 },
              { label: "Meetings", sublabel: "Collaboration", percentage: 25, accent: 2 },
              { label: "Exploration", percentage: 20, accent: 3 },
              { label: "Side projects", percentage: 15, accent: 4 },
            ]}
          />
        </Showcase>

        <Showcase name="ValueCard">
          <div className="space-y-8">
            {valueCards.map((v) => (
              <ValueCard key={v.title} {...v} />
            ))}
          </div>
        </Showcase>

        <Showcase name="ToolCard grid">
          <div className="grid grid-cols-2 gap-3">
            {toolbox.map((t) => (
              <ToolCard key={t.name} {...t} />
            ))}
          </div>
        </Showcase>

        <Showcase name="DevLoop">
          <DevLoop />
        </Showcase>

        <Showcase name="PlusMinus">
          <PlusMinus
            plusTitle="Dopamine Sources++"
            minusTitle="Cortisol Triggers--"
            plusItems={["Lorem shipping small wins", "Ipsum learning in public", "Dolor kind feedback"]}
            minusItems={["Lorem unclear scope", "Ipsum noisy alerts", "Dolor context switching"]}
          />
        </Showcase>

        <Showcase name="CodeSnippet">
          <CodeSnippet filename="excellence.ts" theme="(Dark Mode)" lines={codeLines} />
        </Showcase>

        <Showcase name="PersonalityProfile">
          <PersonalityProfile {...personalitySample} />
        </Showcase>

        <Showcase name="Banner">
          <Banner src={bannerSrc} quote="Lorem ipsum — clarity is a feature." />
        </Showcase>

        <Showcase name="Kanban">
          <Kanban columns={kanbanColumns} />
        </Showcase>

        <Showcase name="QuoteBlock">
          <QuoteBlock attribution="— Lorem Ipsum, 20XX">
            “Design is the silent ambassador of your brand — placeholder edition.”
          </QuoteBlock>
        </Showcase>

        <Showcase name="SectionDivider">
          <SectionDivider />
          <Paragraph>Content continues after a divider.</Paragraph>
        </Showcase>
      </Container>
    </main>
  );
}
