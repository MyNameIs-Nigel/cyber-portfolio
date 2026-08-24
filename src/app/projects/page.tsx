import { Container } from "@/components/Container";
import { SectionDivider } from "@/components/SectionDivider";
import { H1, H2, Paragraph } from "@/components/Typography";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { FakeShellSection } from "@/components/projects/FakeShellSection";
import { FleetSection } from "@/components/projects/fleet/FleetSection";
import { InteractiveProjectsSection } from "@/components/projects/InteractiveProjectsSection";
import { interactiveProjects } from "@/data/interactiveProjects";
import { projects } from "@/data/projects";
import { ConsoleLog } from "@/components/ConsoleLog";
import { thoughtLogMessages, thoughtLogTitle } from "@/data/consoleLogs";


export const metadata = {
  title: "Projects",
  description: "The CI/CD pipeline and AWS infrastructure behind a Go game fleet, plus websites and browser experiments built by Nigel Smith.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects — Nigel Smith's Portfolio",
    description: "The CI/CD pipeline and AWS infrastructure behind a Go game fleet, plus websites and browser experiments built by Nigel Smith.",
    siteName: "Nigel Smith's Portfolio",
    locale: "en_US",
    type: "website",
    url: "https://nigel-smith.dev/projects",
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

/**
 * Jump links. The page runs long enough that a visitor who came for one thing
 * should not have to scroll past the other four to find it. Order matches the
 * document, so the nav doubles as an outline.
 */
const sections = [
  { href: "#fleet", label: "SSH Arcade fleet" },
  { href: "#shell", label: "Portfolio shell" },
  { href: "#web-apps", label: "Web apps" },
  { href: "#thought-log", label: "Thought log" },
  { href: "#interactive", label: "Interactive" },
] as const;

export default function ProjectsPage() {
  return (
    <main>
      <Container className="pt-12 pb-10">
        <H1 firstOnPage>Projects</H1>
        <Paragraph muted className="mb-0">
          Infrastructure I run, websites I&apos;ve shipped, and a few games and tools in progress.
        </Paragraph>

        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
          {sections.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-fg/60 transition-colors duration-200 hover:border-accent-1/50 hover:text-accent-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {label}
            </a>
          ))}
        </nav>
      </Container>

      {/*
        Full-bleed: FleetSection sits outside Container rather than escaping it
        with a `w-screen` transform, which would add a horizontal scrollbar
        wherever a vertical one is present. Its own contents use the same
        Container, so the band changes the colour but not the measure.
      */}
      <FleetSection />

      <Container className="py-12">
        <FakeShellSection headingClassName="mt-0" />

        <SectionDivider />

        <section id="web-apps" className="scroll-mt-16">
          <H2>Featured Web Applications</H2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.slug} {...p} />
            ))}
          </div>
        </section>

        <SectionDivider />

        <section id="thought-log" className="scroll-mt-16">
          <ConsoleLog title={thoughtLogTitle} messages={thoughtLogMessages} />
        </section>

        <SectionDivider />

        <div id="interactive" className="scroll-mt-16">
          <InteractiveProjectsSection items={interactiveProjects} />
        </div>
      </Container>
    </main>
  );
}
