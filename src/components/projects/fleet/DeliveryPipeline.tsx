"use client";

import { useEffect, useRef, useState } from "react";
import type { PipelineStage } from "@/types";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { PipelineNode } from "./PipelineNode";

const RUN_DURATION_MS = 1900;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The line: the delivery path from a push to a live service.
 *
 * Drawn as a top-to-bottom spine at every width rather than a row of columns.
 * At the page's 768px measure five columns would crush the artifact strings —
 * `go test -race ./...` is the whole point, and it has to fit — and a
 * five-column rail always stops at the last column's *start*, leaving a fifth of
 * the section visibly empty on the right. A spine spans the full measure and
 * gives each stage a line of its own.
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
  const lastIndex = stages.length - 1;

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

  // Progress in stage units: 2.4 means the run is 40% of the way from 03 to 04.
  const head = progress * lastIndex;

  return (
    <figure ref={ref} className="m-0">
      <p className="mb-6 font-mono text-xs text-fg/50">
        <span className="text-accent-1">$</span> {trigger}
      </p>

      <ol>
        {stages.map((stage, i) => {
          const fill = clamp01(head - i);
          return (
            <li key={stage.number}>
              <PipelineNode
                stage={stage}
                lit={head >= i}
                nextAccent={i === lastIndex ? null : stages[i + 1].accent}
                fill={fill}
                dot={i < lastIndex && fill > 0 && fill < 1 ? fill : null}
              />
            </li>
          );
        })}
      </ol>

      <figcaption className="sr-only">
        The delivery path, in order: {stages.map((s) => s.label).join(", then ")}. Each stage lists the
        commands and artifacts it produces.
      </figcaption>
    </figure>
  );
}
