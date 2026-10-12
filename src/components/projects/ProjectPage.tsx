import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { ImageSlideshow } from "@/components/ImageSlideshow";
import { H1 } from "@/components/Typography";
import type { Project } from "@/types";

export function projectMetadata(project: Project): Metadata {
  const path = `/projects/${project.slug}`;
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${project.title} — Nigel Smith's Portfolio`,
      description: project.description,
      siteName: "Nigel Smith's Portfolio",
      locale: "en_US",
      type: "website",
      url: `https://nigel-smith.dev${path}`,
      images: [
        project.image
          ? { url: project.image }
          : { url: "/opengraph.png", width: 1200, height: 630 },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * The frame every featured web app page shares: back link, screenshots, title,
 * tags, and outbound links. `children` is the page's own write-up — and any
 * elements unique to that project — placed between the tags and the links.
 */
export function ProjectPage({ project, children }: { project: Project; children: ReactNode }) {
  return (
    <main>
      <Container className="py-12">
        <p className="mb-6">
          <Link
            href="/projects#web-apps"
            className="text-sm text-muted transition-colors duration-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            ← Back to Projects
          </Link>
        </p>

        <ImageSlideshow images={project.screenshots} alt={project.title} />

        <H1 firstOnPage className="mt-8">
          {project.title}
        </H1>

        <div className="mb-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-accent-1/10 px-2.5 py-1 text-xs text-accent-1">
              {tag}
            </span>
          ))}
        </div>

        {children}

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8">
          <p className="font-mono text-xs tracking-[0.08em] text-muted">Links</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-accent-1/50 bg-accent-1/10 px-4 py-2.5 text-sm font-medium text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/15"
              >
                Visit site
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors duration-200 hover:border-accent-1/50"
              >
                Source code
              </a>
            ) : null}
          </div>
        </div>
      </Container>
    </main>
  );
}
