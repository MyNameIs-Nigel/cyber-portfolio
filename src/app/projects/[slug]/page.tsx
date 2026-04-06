import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { ImageSlideshow } from "@/components/ImageSlideshow";
import { H1, Paragraph } from "@/components/Typography";
import { getProjectBySlug, projects } from "@/data/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) {
    return { title: "Project not found" };
  }
  const title = `${project.title} — Nigel Smith's Portfolio`;
  return {
    title,
    description: project.description,
    openGraph: {
      title,
      description: project.description,
      images: project.image
        ? [
            {
              url: project.image,
              width: 1200,
              height: 630,
            },
          ]
        : [
            {
              url: "/opengraph.png",
              width: 1200,
              height: 630,
            },
          ],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  const showDemoCta =
    Boolean(project.demoUrl) &&
    (!project.link || project.demoUrl !== project.link);

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

        {project.content.map((paragraph, i) => (
          <Paragraph key={i}>{paragraph}</Paragraph>
        ))}

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8">
          <p className="text-xs font-mono uppercase tracking-widest text-muted">Links</p>
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
            {showDemoCta ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors duration-200 hover:border-accent-1/50"
              >
                View demo
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
