import { Container } from "@/components/Container";
import { SectionDivider } from "@/components/SectionDivider";
import { H1, H2, Paragraph } from "@/components/Typography";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { FakeShellSection } from "@/components/projects/FakeShellSection";
import { InteractiveProjectsSection } from "@/components/projects/InteractiveProjectsSection";
import { publicInteractiveProjects } from "@/data/interactiveProjects";
import { projects } from "@/data/projects";
import { ConsoleLog } from "@/components/ConsoleLog";
import { thoughtLogMessages, thoughtLogTitle } from "@/data/consoleLogs";


export const metadata = {
  title: "Projects",
  description: "Project showcase for Nigel Smith's portfolio.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects — Nigel Smith's Portfolio",
    description: "Project showcase for Nigel Smith's portfolio.",
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
      <Container className="py-12">
        <H1 firstOnPage>Projects</H1>
        <Paragraph muted className="pb-6">
          A curated collection of work spanning frontend, backend, and everything in between. Feel free to look around and see what I&apos;ve been working on.
        </Paragraph>

        <FakeShellSection />


        <SectionDivider />
        <H2>Featured Web Applications</H2>
        <div className="mt-4 grid grid-cols-1 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.slug} {...p} />
          ))}
        </div>

        <SectionDivider />

        <H2>Other Work</H2>
        <Paragraph muted>
          Smaller experiments, open-source contributions, and side projects that didn&#39;t make the featured cut — but still worth a look.
        </Paragraph>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "SSH-IdleFarmer", desc: "A calming Terminal UI game that you can SSH into. Try ssh farm.ssharcade.dev now! (SSH Keys needed)", tags: ["Go", "Terminal UI"] },
            { title: "Contextual LLMcord", desc: "Fully vibe coded Discord bot that takes the chat as context, saves memories on users, and will occasionally make fun of you.", tags: ["Node.js", "LLM", "Discord"] },
            { title: "This Portfolio", desc: "This website you are on now!", tags: ["Next.js", "Vercel"] },
            { title: "Other Contributions", desc: "My other contributions and projects can be found on my GitHub at MyNameIs-Nigel", tags: ["Many More..."] },
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

        <InteractiveProjectsSection items={publicInteractiveProjects} />
      </Container>
    </main>
  );
}
