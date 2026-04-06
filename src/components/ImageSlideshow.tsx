"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function ImageSlideshow({
  images,
  alt = "Project screenshot",
}: {
  images: string[];
  alt?: string;
}) {
  const [index, setIndex] = useState(0);

  const len = images.length;
  const current = len === 0 ? 0 : Math.min(index, len - 1);

  const prev = useCallback(() => {
    if (len <= 1) return;
    setIndex((prevIdx) => {
      const cur = Math.min(prevIdx, len - 1);
      return (cur - 1 + len) % len;
    });
  }, [len]);

  const next = useCallback(() => {
    if (len <= 1) return;
    setIndex((prevIdx) => {
      const cur = Math.min(prevIdx, len - 1);
      return (cur + 1) % len;
    });
  }, [len]);

  const goTo = useCallback(
    (targetIndex: number) => {
      if (len <= 1) return;
      const i = ((targetIndex % len) + len) % len;
      setIndex((prevIdx) => {
        const cur = Math.min(prevIdx, len - 1);
        if (i === cur) return prevIdx;
        return i;
      });
    },
    [len],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prev, next]);

  if (len === 0) {
    return (
      <div
        className="flex aspect-video w-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted"
        role="img"
        aria-label={alt}
      >
        No images
      </div>
    );
  }

  const src = images[current];
  const showControls = len > 1;

  return (
    <div className="w-full">
      <div
        className="group relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface"
        role="region"
        aria-roledescription="carousel"
        aria-label={alt}
      >
        <Image
          src={src}
          alt={`${alt} — ${current + 1} of ${len}`}
          fill
          className="object-cover transition-opacity duration-200"
          sizes="600px"
          priority={current === 0}
        />

        {showControls ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-bg/60 text-fg opacity-0 backdrop-blur-md transition-all duration-200 hover:bg-bg/80 focus-visible:opacity-100 group-hover:opacity-100 md:left-3"
              aria-label="Previous image"
            >
              <span className="text-lg leading-none" aria-hidden>
                ‹
              </span>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-bg/60 text-fg opacity-0 backdrop-blur-md transition-all duration-200 hover:bg-bg/80 focus-visible:opacity-100 group-hover:opacity-100 md:right-3"
              aria-label="Next image"
            >
              <span className="text-lg leading-none" aria-hidden>
                ›
              </span>
            </button>
          </>
        ) : null}
      </div>

      {showControls ? (
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Slide indicators">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                i === current ? "bg-accent-1" : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
