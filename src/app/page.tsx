import { AccentList } from "@/components/AccentList";
import { Container } from "@/components/Container";
import { SectionDivider } from "@/components/SectionDivider";
import { Terminal } from "@/components/Terminal";
import { Hero } from "@/components/Hero";
import { Stats, type Stat } from "@/components/Stats";
import { H1, H2, H3, Paragraph } from "@/components/Typography";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { SkillCard } from "@/components/cards/SkillCard";
import { CertificationsSection } from "@/components/CertificationsSection";
import { earnedCertifications } from "@/data/certifications";
import { projects } from "@/data/projects";
import Link from "next/link";
import { skillCategories } from "@/data/skills";
import { terminalHeaders, terminalInput, terminalRows, terminalTitle } from "@/data/terminal";
import { QuoteBlock } from "@/components/QuoteBlock";
import { profile, workHighlights } from "@/data/profile";
import { FLEET_SERVICE_COUNT } from "@/data/fleet";

const heroStats: Stat[] = [
  { value: FLEET_SERVICE_COUNT, label: "Go services shipped through CI/CD", accent: 1 },
  { value: earnedCertifications.length, label: "Certifications earned", accent: 4 },
  { value: 14, suffix: "%", label: "AWS spend cut at Roundsphere", accent: 3 },
  { value: 3, suffix: "+", label: "Years in IT", accent: 2 },
];

// Terminal-style path label per skill category (index-aligned with skillCategories).
const skillTags = ["~/cloud", "~/automation", "~/infra", "~/security", "~/network", "~/scripting"];

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
          I&apos;m a cybersecurity student at BYU&ndash;Idaho and a security and infrastructure engineer at Fybercom, an internet provider in Idaho Falls. I started there on the support line, and I now review the development team&apos;s pull requests, keep our Proxmox VMs patched, and track the CVEs that affect them.
        </Paragraph>
        <Paragraph>
          Outside work I build the same way. My SSH arcade ships itself through GitHub Actions, my homelab runs on Proxmox, and a few n8n workflows hand the tedious parts of email and paperwork to language models. I&apos;m looking for work where security, CI/CD, and AI-assisted automation meet.
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
        <H3>Experience</H3>
        <div className="mt-4 space-y-8">
          {profile.experience.map((job) => (
            <div key={job.company}>
              <p className="font-semibold text-fg">
                {job.company} <span className="text-sm font-normal text-muted">· {job.location}</span>
              </p>
              <ol className={job.roles.length > 1 ? "mt-3 space-y-5 border-l-2 border-accent-1/30 pl-4" : "mt-1"}>
                {job.roles.map((role, i) => (
                  <li key={role.title}>
                    <p className="text-sm text-fg">
                      {role.title}
                      {job.roles.length > 1 && i === 0 ? (
                        <span className="ml-2 rounded-full border border-accent-1/30 bg-accent-1/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-1">
                          Promoted
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">{role.dates}</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {role.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
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

      </Container>
    </main>
  );
}
