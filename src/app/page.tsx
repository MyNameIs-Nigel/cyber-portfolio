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
import { CertificationsSection } from "@/components/CertificationsSection";
import { earnedCertifications } from "@/data/certifications";
import { projects } from "@/data/projects";
import Link from "next/link";
import { roadmapSections } from "@/data/roadmap";
import { skillCategories } from "@/data/skills";
import { terminalHeaders, terminalInput, terminalRows, terminalTitle } from "@/data/terminal";
import { QuoteBlock } from "@/components/QuoteBlock";

const heroStats: Stat[] = [
  { value: 14, suffix: "%", label: "AWS cost reduced", accent: 1 },
  { value: earnedCertifications.length, label: "Certifications", accent: 4 },
  { value: 11, label: "Web apps shipped", accent: 3 },
  { value: 3, suffix: "+", label: "Years in tech", accent: 2 },
];

// Terminal-style path label per skill category (index-aligned with skillCategories).
const skillTags = ["~/cloud", "~/scripting", "~/infra", "~/security"];

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
          I build cloud infrastructure and automate the repetitive work around it. Right now that means AWS, infrastructure as code, and a cybersecurity degree.
        </Paragraph>
        <Paragraph>
          I&apos;m looking for DevOps or cloud security work where I can keep improving both sides of that stack.
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

        <CertificationsSection />

        <SectionDivider />

        <H2>Work I&apos;m Proud Of</H2>
        <AccentList accent={4} items={["Cut monthly AWS costs by 14% ($700) after auditing and consolidating RDS infrastructure", "Moved enterprise Google Workspace environments without interrupting users", "Built and launched client websites, including their DNS and domain setup"]} />

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
