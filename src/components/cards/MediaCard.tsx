import Image from "next/image";
import type { MediaCardProps } from "@/types";

const accentLine: Record<NonNullable<MediaCardProps["accent"]>, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

export function MediaCard({ image, title, subtitle, accent }: MediaCardProps) {
  return (
    <article className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover transition-all duration-200 group-hover:scale-[1.02] group-hover:opacity-100 opacity-90"
          sizes="(max-width: 768px) 50vw, 384px"
        />
        {accent ? <div className={`absolute left-0 top-0 h-full w-0.5 ${accentLine[accent]}`} aria-hidden /> : null}
      </div>
      <div className="mt-1.5 flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-fg">{title}</h3>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </article>
  );
}
