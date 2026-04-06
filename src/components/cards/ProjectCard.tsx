import Image from "next/image";
import Link from "next/link";
import type { ProjectCardProps } from "@/types";

export function ProjectCard({ title, description, tags, link, image, slug }: ProjectCardProps) {
  const showArrow = Boolean(slug || link);

  const inner = (
    <>
      {image ? (
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
          <Image src={image} alt="" fill className="object-cover" sizes="768px" />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-accent-1/10 px-2.5 py-1 text-xs text-accent-1">
            {tag}
          </span>
        ))}
      </div>
      {showArrow ? (
        <div className="mt-4 flex justify-end text-accent-1">
          <span className="text-sm font-medium transition-colors duration-200 group-hover:text-accent-2" aria-hidden>
            →
          </span>
        </div>
      ) : null}
    </>
  );

  const className =
    "group block rounded-xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-accent-1/50";

  if (slug) {
    return (
      <Link href={`/projects/${slug}`} className={className}>
        {inner}
      </Link>
    );
  }

  if (link) {
    return (
      <Link href={link} className={className} target="_blank" rel="noopener noreferrer">
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
