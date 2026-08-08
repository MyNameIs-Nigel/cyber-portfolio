import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { InteractiveMobileWarningModal } from "@/components/InteractiveMobileWarningModal";
import { H1, Paragraph } from "@/components/Typography";
import { getVisibleInteractiveProjectBySlug, visibleInteractiveProjects } from "@/data/interactiveProjects";
import { InteractiveAppHost } from "@/features/interactive/InteractiveAppHost";
import { isLiveInteractiveSlug } from "@/features/interactive/registry-meta";
import type { InteractiveProjectCategory } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
};

const categoryLabel: Record<InteractiveProjectCategory, string> = {
  game: "Game",
  tool: "Tool",
  "portfolio-builder": "Portfolio builder",
};

export function generateStaticParams() {
  return visibleInteractiveProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getVisibleInteractiveProjectBySlug(slug);
  if (!project) {
    return { title: "Interactive project not found" };
  }
  const ogTitle = `${project.title} — Nigel Smith's Portfolio`;
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/interactive/${slug}` },
    openGraph: {
      title: ogTitle,
      description: project.description,
      siteName: "Nigel Smith's Portfolio",
      locale: "en_US",
      type: "website",
      url: `https://nigel-smith.dev/projects/interactive/${slug}`,
      images: [
        {
          url: project.icon,
          width: 256,
          height: 256,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function InteractiveProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getVisibleInteractiveProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  const isComingSoon = project.status === "coming-soon";
  const showInteractive = !isComingSoon && isLiveInteractiveSlug(slug);
  // Tools stay usable on a phone; only the games need the desktop nudge.
  const warnOnMobile = showInteractive && project.category === "game";

  return (
    <main>
      {warnOnMobile ? <InteractiveMobileWarningModal /> : null}
      <Container className="py-12">
        <p className="mb-6">
          <Link
            href="/projects"
            className="text-sm text-muted transition-colors duration-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            ← Back to Projects
          </Link>
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-1/10 px-2.5 py-1 text-xs text-accent-1">{categoryLabel[project.category]}</span>
          {isComingSoon ? (
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">Coming soon</span>
          ) : null}
        </div>

        <H1 firstOnPage>{project.title}</H1>

        <Paragraph className="mt-4">{project.description}</Paragraph>

        {isComingSoon ? (
          <Paragraph muted className="mt-4">
            This page is a placeholder. The interactive experience will load here once it&apos;s built.
          </Paragraph>
        ) : null}

        {showInteractive ? <InteractiveAppHost slug={slug} /> : null}

        {!isComingSoon && !showInteractive ? (
          <Paragraph muted className="mt-4">
            This project is marked live, but no interactive module is registered for this slug yet.
          </Paragraph>
        ) : null}
      </Container>
    </main>
  );
}
