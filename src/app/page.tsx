import { AccentList } from "@/components/AccentList";
import { Container } from "@/components/Container";
import { SectionDivider } from "@/components/SectionDivider";
import { Terminal } from "@/components/Terminal";
import { Hero } from "@/components/Hero";
import { Stats, type Stat } from "@/components/Stats";
import { H1, H2, H3, Paragraph } from "@/components/Typography";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { SkillCard } from "@/components/cards/SkillCard";
import { Roadmap } from "@/components/Roadmap";
import { projects } from "@/data/projects";
import Link from "next/link";
import { roadmapSections } from "@/data/roadmap";
import { skillCategories } from "@/data/skills";
import { terminalHeaders, terminalInput, terminalRows, terminalTitle } from "@/data/terminal";
import { QuoteBlock } from "@/components/QuoteBlock";

const heroStats: Stat[] = [
  { value: 14, suffix: "%", label: "AWS cost reduced", accent: 1 },
  { value: 4, label: "Certifications", accent: 4 },
  { value: 4, label: "Web apps shipped", accent: 3 },
  { value: 3, suffix: "+", label: "Years in tech", accent: 2 },
];

// Terminal-style path label per skill category (index-aligned with skillCategories).
const skillTags = ["~/cloud", "~/scripting", "~/infra", "~/security"];

const certifications: { name: string; status: "earned" | "anticipated"; note?: string }[] = [
  { name: "ISC² Certified in Cybersecurity (CC)", status: "earned" },
  { name: "CompTIA A+", status: "earned" },
  { name: "CompTIA Security+", status: "anticipated", note: "Jul 2026" },
  { name: "AWS Cloud Practitioner", status: "anticipated", note: "Jul 2026" },
];

export default function HomePage() {
  return (
    <main>

      <Container className="py-12">
      <Hero />

        <div className="mt-8">
          <Stats items={heroStats} />
        </div>

        <H1>About Me</H1>
        <Paragraph>
          I build cloud infrastructure and automate the toil around it. Currently: AWS workloads, IaC, and a cybersecurity degree I&apos;m using as a DevSecOps edge rather than a SOC ticket to punch.
        </Paragraph>
        <Paragraph>
          I&apos;m targeting a DevOps or cloud security role where I can bridge infrastructure automation with security-first thinking.
        </Paragraph>

        <QuoteBlock attribution="— Brené Brown, 2015">
          &ldquo;Integrity is choosing courage over comfort; choosing what is right over what is fun, fast, or easy; and choosing to practice our values rather than simply professing them.&rdquo;
        </QuoteBlock>

        <SectionDivider />
        
        <H2>Skills & Expertise</H2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {skillCategories.map((cat, i) => (
            <SkillCard
              key={cat.title}
              title={cat.title}
              accent={cat.accent}
              items={cat.items}
              tag={skillTags[i] ?? "~/"}
            />
          ))}
        </div>


        <SectionDivider />

        <section id="projects">
          <H2>Featured Web Apps</H2>
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
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {certifications.map((cert) => (
            <li
              key={cert.name}
              className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors duration-200 hover:border-accent-1/50"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${cert.status === "earned" ? "bg-accent-1" : "bg-accent-2"}`}
                  aria-hidden
                />
                <span className="text-sm font-medium text-fg">{cert.name}</span>
              </span>
              {cert.status === "earned" ? (
                <span className="shrink-0 rounded-full border border-accent-1/30 bg-accent-1/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-1">
                  Earned
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-accent-2/30 bg-accent-2/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-2">
                  {cert.note}
                </span>
              )}
            </li>
          ))}
        </ul>

        <SectionDivider />

        <H2>Some Early Career Successes</H2>
        <Paragraph>
          I&apos;ve had the opportunity to work on some projects that I&apos;m proud of.
        </Paragraph>
        <AccentList accent={4} items={["Audited and consolidated AWS RDS infrastructure, reducing monthly cloud expenditure by 14% ($700/mo)", "Executed seamless zero-downtime migrations of enterprise Google Workspace environments", "Engineered client-facing web applications from scratch using Next.js, managing DNS and domain controllers."]} />
        <Paragraph muted className="pt-6">
        That&apos;s not all I&apos;ve done, but those are some I&apos;m glad to say I oversaw.
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
