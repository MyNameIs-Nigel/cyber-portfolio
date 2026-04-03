import Image from "next/image";
import type { PhotoCardProps } from "@/types";

export function PhotoCard({ image, caption }: PhotoCardProps) {
  return (
    <figure className="group relative aspect-[3/4] overflow-hidden rounded-lg">
      <Image
        src={image}
        alt=""
        fill
        className="object-cover transition-all duration-200 group-hover:brightness-110"
        sizes="(max-width: 600px) 50vw, 300px"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
      {caption ? (
        <figcaption className="absolute bottom-3 left-3 text-xs text-white/80">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
