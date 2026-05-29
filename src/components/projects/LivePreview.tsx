"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Props {
  url: string;
  previewWidth?: number;
  fallbackImage?: string;
}

type LoadState = "pending" | "loaded" | "failed";

export function LivePreview({ url, previewWidth = 1024, fallbackImage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [inView, setInView] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("pending");

  // Keep scale in sync with the card's actual rendered width.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => setScale(el.clientWidth / previewWidth);
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewWidth]);

  // Mount the iframe only when the card scrolls near the viewport.
  // Respect prefers-reduced-data by skipping the live embed entirely.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Safety timeout: revert to fallback if the iframe hasn't fired onLoad in 10 s.
  useEffect(() => {
    if (!inView || loadState !== "pending") return;
    const t = setTimeout(() => setLoadState("failed"), 10_000);
    return () => clearTimeout(t);
  }, [inView, loadState]);

  const previewHeight = Math.round((previewWidth * 9) / 16);

  return (
    <div
      ref={containerRef}
      className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg"
    >
      {/* Static screenshot — always present as the base layer / fallback */}
      {fallbackImage && (
        <Image src={fallbackImage} alt="" fill className="object-cover" sizes="768px" />
      )}

      {/* Live iframe — mounted in-viewport, fades in once the page has loaded */}
      {inView && loadState !== "failed" && (
        <div
          className="absolute inset-0"
          style={{
            opacity: loadState === "loaded" ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            style={{
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              width: previewWidth,
              height: previewHeight,
            }}
          >
            <iframe
              src={url}
              width={previewWidth}
              height={previewHeight}
              style={{ border: "none", display: "block", pointerEvents: "none" }}
              scrolling="no"
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              onLoad={() => setLoadState("loaded")}
            />
          </div>
        </div>
      )}

      {/* Transparent overlay: absorbs scroll/clicks so they never reach the
          iframe, and lets the tap fall through to the card's parent <Link>. */}
      <div className="absolute inset-0 z-10" aria-hidden="true" />
    </div>
  );
}
