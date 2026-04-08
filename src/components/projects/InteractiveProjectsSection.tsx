import Image from "next/image";
import Link from "next/link";
import type { InteractiveProject } from "@/types";
import { H2, Paragraph } from "@/components/Typography";

function InteractiveProjectIconTile({ project }: { project: InteractiveProject }) {
  return (
    <Link
      href={`/projects/interactive/${project.slug}`}
      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface outline-none transition-colors duration-200 hover:border-accent-1/50 focus-visible:border-accent-1 focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={project.title}
    >
      <Image
        src={project.icon}
        alt=""
        fill
        className="object-cover transition-all duration-300 ease-out group-hover:blur-md group-hover:brightness-[0.35] group-focus-visible:blur-md group-focus-visible:brightness-[0.35]"
        sizes="(max-width: 640px) 50vw, 256px"
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 p-3 transition-colors duration-200 group-hover:bg-black/40 group-focus-visible:bg-black/40"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="text-center text-base font-semibold text-fg drop-shadow-md">{project.title}</span>
      </div>
    </Link>
  );
}

export function InteractiveProjectsSection({ items }: { items: InteractiveProject[] }) {
  return (
    <section aria-labelledby="interactive-projects-heading" className="pb-6">
      <H2 id="interactive-projects-heading" className="!mt-4 sm:!mt-6">
        Interactive
      </H2>
      <Paragraph muted className="mt-2 pb-4">
        Mini games, tools, and experiments you can open in the browser. Hover a tile to see its name.
      </Paragraph>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((project) => (
          <InteractiveProjectIconTile key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
