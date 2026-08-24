"use client";

import { useEffect, useRef, useState } from "react";
import type { PipelineStage } from "@/types";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { PipelineNode } from "./PipelineNode";

const RUN_DURATION_MS = 1900;

/**
 * The line: the delivery path from a push to a live service.
 *
 * The rail runs exactly once, when it first scrolls into view, and then stops —
 * a deploy runs once, so the animation does too. Ambient motion would say
 * something untrue about the thing being drawn.
 *
 * The drawn rail is decoration (`aria-hidden`); the stages themselves are an
 * ordered list, so the sequence reaches assistive tech without the graphic.
 */
export function DeliveryPipeline({ stages, trigger }: { stages: PipelineStage[]; trigger: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const [runProgress, setRunProgress] = useState(0);
  const [started, setStarted] = useState(false);

  /*
    Derived, not stored: reduced motion settles the rail immediately and does not
    wait to be scrolled into view. The run is the only thing scrolling gates, and
    someone who will never see it should not be left looking at an unlit rail.
  */
  const progress = reduce ? 1 : runProgress;

  // Start on first intersection only — scrolling away and back must not replay it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / RUN_DURATION_MS);
      // Ease-out: the run leaves the gate quickly and settles into the last stage.
      setRunProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setRunProgress(1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, reduce]);

  const lastIndex = stages.length - 1;
  const reached = (i: number) => progress >= (lastIndex === 0 ? 0 : i / lastIndex);
  const running = progress > 0 && progress < 1;

  return (
    <figure ref={ref} className="m-0">
      <p className="mb-6 font-mono text-xs text-fg/50">
        <span className="text-accent-1">$</span> {trigger}
      </p>

      <div className="relative">
        {/*
          Desktop rail. Columns are exactly 20% wide with no grid gap, so every
          marker centre lands at `i * 20% + 18px` and the track can span a flat
          80% between the first and last without measuring the DOM.
        */}
        <div aria-hidden className="pointer-events-none absolute left-[18px] top-[18px] hidden h-px w-4/5 bg-rail lg:block">
          <div
            className="h-full bg-gradient-to-r from-accent-3 via-accent-1 to-accent-2 transition-none"
            style={{ width: `${progress * 100}%` }}
          />
          {running ? (
            <span
              className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg shadow-[0_0_8px_2px_rgba(229,229,229,0.5)]"
              style={{ left: `${progress * 100}%` }}
            />
          ) : null}
        </div>

        <ol className="grid grid-cols-1 lg:grid-cols-5">
          {stages.map((stage, i) => (
            <li key={stage.number} className="lg:pr-6">
              <PipelineNode
                stage={stage}
                lit={reached(i)}
                spineLit={reached(i + 1)}
                last={i === lastIndex}
              />
            </li>
          ))}
        </ol>
      </div>

      <figcaption className="sr-only">
        The delivery path, in order: {stages.map((s) => s.label).join(", then ")}. Each stage lists the
        commands and artifacts it produces.
      </figcaption>
    </figure>
  );
}
