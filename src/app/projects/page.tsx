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

export default function ProjectsPage() {
  return (
    <main>
      <Container className="pt-12 pb-10">
        <H1 firstOnPage>Projects</H1>
        <Paragraph muted className="mb-0">
          Infrastructure I run, websites I&apos;ve shipped, and a few games and tools in progress.
        </Paragraph>
      </Container>

      {/*
        Full-bleed: FleetSection sits outside Container rather than escaping it
        with a `w-screen` transform, which would add a horizontal scrollbar
        wherever a vertical one is present.
      */}
      <FleetSection />

      <Container className="py-12">
        <H2 className="mt-0">Featured Web Applications</H2>
        <div className="mt-4 grid grid-cols-1 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.slug} {...p} />
          ))}
        </div>

        <SectionDivider />

        <FakeShellSection />

        <SectionDivider />

        <H2>Other Work</H2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "Contextual LLMcord", desc: "A Discord bot that reads recent chat, remembers regulars, and occasionally roasts them.", tags: ["Node.js", "LLM", "Discord"] },
            { title: "This Portfolio", desc: "The site you're browsing, including its fake shell and interactive projects.", tags: ["Next.js", "Vercel"] },
            { title: "GitHub", desc: "Smaller projects and contributions live under MyNameIs-Nigel.", tags: ["More projects"] },
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

        <ConsoleLog title={thoughtLogTitle} messages={thoughtLogMessages} />

        <SectionDivider />

        <InteractiveProjectsSection items={interactiveProjects} />
      </Container>
    </main>
  );
}
