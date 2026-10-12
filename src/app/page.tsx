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
import { profile, workHighlights } from "@/data/profile";

const heroStats: Stat[] = [
  { value: 14, suffix: "%", label: "AWS cost reduced", accent: 1 },
  { value: earnedCertifications.length, label: "Certifications", accent: 4 },
  { value: 200, suffix: "+", label: "Support calls monthly", accent: 3 },
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
            <p className="font-semibold text-fg">{profile.education.school}</p>
            <p className="text-sm text-muted">{profile.education.degree} · {profile.education.graduation}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {profile.education.coursework.map((course) => <li key={course}>• {course}</li>)}
            </ul>
          </div>
        </div>
        <H3>Highlighted Experience</H3>
        <div className="mt-4 space-y-8">
          {profile.experience.map((job) => (
            <div key={job.company}>
              <p className="font-semibold text-fg">{job.company}</p>
              <p className="text-sm text-muted">{job.title} · {job.dates} · {job.location}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {job.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <SectionDivider />

        <CertificationsSection />

        <SectionDivider />

        <H2>Work I&apos;m Proud Of</H2>
        <AccentList accent={4} items={workHighlights} />

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
