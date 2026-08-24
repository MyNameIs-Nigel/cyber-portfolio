import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { H1, H2, Paragraph } from "@/components/Typography";
import { accentText } from "@/components/projects/fleet/accents";
import { FLEET_TITLE } from "@/data/fleet";
import {
  FLEET_LIMITS,
  FLEET_LINKS,
  FLEET_SUMMARY,
  FLEET_TAGS,
  caseStudySections,
} from "@/data/fleetCaseStudy";

/**
 * A static segment sitting beside the `[slug]` dynamic route. Next gives static
 * segments precedence, so this needs no entry in `projects.ts` and cannot
 * collide with one. The shared case-study template is prose-only; this project's
 * evidence is config, so it gets its own page.
 */

const DESCRIPTION =
  "How a four-repo Go fleet ships through GitHub Actions onto a single EC2 instance, with SQLite replicated to S3 so the host is disposable.";

export const metadata: Metadata = {
  title: "SSH Arcade — the fleet",
  description: DESCRIPTION,
  alternates: { canonical: "/projects/ssh-arcade-fleet" },
  openGraph: {
    title: "SSH Arcade — the fleet — Nigel Smith's Portfolio",
    description: DESCRIPTION,
    siteName: "Nigel Smith's Portfolio",
    locale: "en_US",
    type: "website",
    url: "https://nigel-smith.dev/projects/ssh-arcade-fleet",
    images: [{ url: "/opengraph.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function SshArcadeFleetPage() {
  return (
    <main>
      <Container className="py-12">
        <p className="mb-6">
          <Link
            href="/projects"
            className="text-sm text-muted transition-colors duration-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            ← Back to Projects
          </Link>
        </p>

        <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-accent-2">
          Infrastructure · ssharcade
        </p>
        <H1 firstOnPage className="mt-3">
          {FLEET_TITLE}
        </H1>

        <div className="mb-6 flex flex-wrap gap-2">
          {FLEET_TAGS.map((tag) => (
            <span key={tag} className="rounded-full bg-accent-1/10 px-2.5 py-1 text-xs text-accent-1">
              {tag}
            </span>
          ))}
        </div>

        <Paragraph muted>{FLEET_SUMMARY}</Paragraph>

        {caseStudySections.map((section) => (
          <section key={section.id} className="mt-12">
            <p className={`font-mono text-[11px] font-semibold tracking-[0.08em] ${accentText[section.accent]}`}>
              {section.eyebrow}
            </p>
            <H2 className="mt-2">{section.title}</H2>

            {section.body.map((paragraph, i) => (
              <Paragraph key={i}>{paragraph}</Paragraph>
            ))}

            {section.code ? (
              <figure className="my-6 overflow-hidden rounded-xl border border-border bg-surface">
                <figcaption className="border-b border-border px-4 py-2.5 font-mono text-[11px] text-fg/55">
                  {section.code.caption}
                </figcaption>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg/80">
                  <code>{section.code.content}</code>
                </pre>
              </figure>
            ) : null}

            {section.specs ? (
              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[auto_1fr]">
                {section.specs.map((spec) => (
                  <div key={spec.term} className="contents">
                    <dt className="font-mono text-[11px] tracking-[0.04em] text-fg/50 sm:pt-0.5">
                      {spec.term}
                    </dt>
                    <dd className="font-mono text-xs leading-relaxed text-fg/80 sm:mb-0">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ))}

        <section className="mt-12">
          <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">
            What this does not claim
          </p>
          <H2 className="mt-2">Where the story stops</H2>
          <ul className="mt-4 space-y-3 border-l-2 border-rail pl-4">
            {FLEET_LIMITS.map((limit) => (
              <li key={limit} className="text-sm leading-relaxed text-muted">
                {limit}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-8">
          <p className="font-mono text-xs tracking-[0.08em] text-muted">Links</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {FLEET_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  link.primary
                    ? "inline-flex items-center justify-center rounded-xl border border-accent-1/50 bg-accent-1/10 px-4 py-2.5 text-sm font-medium text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/15"
                    : "inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors duration-200 hover:border-accent-1/50"
                }
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
