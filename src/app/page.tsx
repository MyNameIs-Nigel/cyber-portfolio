import { AccentList } from "@/components/AccentList";
import { Container } from "@/components/Container";
import { SectionDivider } from "@/components/SectionDivider";
import { Banner } from "@/components/Banner";
import { Terminal } from "@/components/Terminal";
import { LiveClock } from "@/components/LiveClock";
import { SiteTitle } from "@/components/SiteTitle";
import { H1, H2, H3, Paragraph } from "@/components/Typography";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { Roadmap } from "@/components/Roadmap";
import { projects } from "@/data/projects";
import Link from "next/link";
import { roadmapSections } from "@/data/roadmap";
import { skillCategories } from "@/data/skills";
import { terminalHeaders, terminalInput, terminalRows, terminalTitle } from "@/data/terminal";
import { QuoteBlock } from "@/components/QuoteBlock";

const bannerSrc = "/hero.jpg";

export default function HomePage() {
  return (
    <main>

      <Container className="py-12">
      <SiteTitle />
      <Banner src={bannerSrc} quote="Nigel Smith — shot on Kodak Ektachrome 100" />

        <H1>About Me</H1>
        <p className="mb-2 text-sm text-muted">Cybersecurity Student · BYU-Idaho</p>
        <p className="mb-4 font-mono text-xs text-muted">Rexburg, ID · <LiveClock /></p>



        <Paragraph>
          I'm Nigel — a DevOps and cloud infrastructure engineer currently studying Cybersecurity at BYU-Idaho.
          I've migrated production workloads to AWS CloudFormation, cut cloud spend by 14%, and built full-stack web applications with CI/CD pipelines.
        </Paragraph>
        <Paragraph>
          I'm targeting a DevOps or cloud security role where I can bridge infrastructure automation with security-first thinking.
        </Paragraph>

        <QuoteBlock attribution="— Brené Brown, 2015">
          "Integrity is choosing courage over comfort; choosing what is right over what is fun, fast, or easy; and choosing to practice our values rather than simply professing them."
        </QuoteBlock>

        <SectionDivider />
        
        <H2>Skills & Expertise</H2>
        <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {skillCategories.map((cat) => (
            <div key={cat.title}>
              <p className="mb-2 text-lg font-medium tracking-tight text-fg">{cat.title}</p>
              <AccentList accent={cat.accent} items={cat.items} />
            </div>
          ))}
        </div>


        <SectionDivider />

        <section id="projects">
          <H2>Featured Projects</H2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {projects.slice(0, 2).map((p) => (
              <ProjectCard key={p.slug} {...p} />
            ))}
          </div>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm font-medium text-accent-1 transition-colors hover:text-accent-2"
          >
            See More →
          </Link>
        </section>

        <SectionDivider />

        <H3>Education</H3>
        <div className="mt-4 space-y-8">
          <div>
            <p className="font-semibold text-fg">Brigham Young University–Idaho</p>
            <p className="text-sm text-muted">B.S. Cybersecurity · EST. 2027</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>• Cloud Infrastructure</li>
              <li>• Networking</li>
              <li>• Cybersecurity</li>
              <li>• Programming</li>
            </ul>
          </div>
        </div>
        <H3>Highlighted Experience</H3>
        <div className="mt-4 space-y-8">
          <div>
            <p className="font-semibold text-fg">Roundsphere</p>
            <p className="text-sm text-muted">DevOps Intern · Nov 2025 – May 2026 · Remote / Athens, GA</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>• Migrated production apps to AWS CloudFormation IaC</li>
              <li>• Reduced cloud spend 14% by auditing and consolidating AWS RDS</li>
              <li>• Oversaw Google Workspace org-to-org migrations</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-fg">Fybercom</p>
            <p className="text-sm text-muted">Technical Support · March 2026 – Present · Idaho Falls, ID</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>• Configures Ubiquiti, Cambium, and Tarana radios and fiber equipment</li>
              <li>• Manages CRM systems to resolve customer network and speed tickets</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-fg">The Home Depot</p>
            <p className="text-sm text-muted">Service Desk Associate · Aug 2022 – Jan 2025 · Monroe, GA</p>
          </div>
        </div>

        <SectionDivider />

        <H3>Certifications</H3>
        <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-fg sm:grid-cols-2">
          <li className="rounded-lg border border-border bg-surface px-3 py-2 font-bold">ISC² Certified in Cybersecurity (CC)</li>
          <li className="rounded-lg border border-border bg-surface px-3 py-2 font-bold">CompTIA A+</li>
          <li className="rounded-lg border border-border bg-surface px-3 py-2">CompTIA Security+ (Anticipated June 2026)</li>
          <li className="rounded-lg border border-border bg-surface px-3 py-2">AWS Cloud Practitioner (Anticipated June 2026)</li>
        </ul>

        <SectionDivider />

        <H2>Some Early Career Sucesses</H2>
        <Paragraph>
          I've had the opportunity to work on some projects that I'm proud of.
        </Paragraph>
        <AccentList accent={4} items={["Audited and consolidated AWS RDS infrastructure, reducing monthly cloud expenditure by 14% ($700/mo)", "Executed seamless zero-downtime migrations of enterprise Google Workspace environments", "Engineered client-facing web applications from scratch using Next.js, managing DNS and domain controllers."]} />
        <Paragraph muted className="pt-6">
        That's not all I've done, but those are some I'm glad to say I oversaw.
        </Paragraph>

        <SectionDivider />

        <div className="mt-4">
          <Terminal title={terminalTitle} columnHeaders={terminalHeaders} rows={terminalRows} input={terminalInput} mobileHiddenColumns={[0, 3]} />
        </div>

        <SectionDivider />

        <H2>Future Roadmap</H2>
        <div className="mt-4">
          <Roadmap sections={roadmapSections} />
        </div>
      </Container>
    </main>
  );
}
