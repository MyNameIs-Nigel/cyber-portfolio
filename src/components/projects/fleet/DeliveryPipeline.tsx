"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PipelineStage } from "@/types";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { accentChip } from "./accents";
import { PipelineNode } from "./PipelineNode";

const RUN_DURATION_MS = 1900;

/**
 * The line: the delivery path from a push to a live service.
 *
 * Drawn as one horizontal track. It used to be a top-to-bottom spine with every
 * stage's commands listed beside it, which was honest but made the pipeline the
 * tallest object on a page that is supposed to be about an arcade. Horizontal at
 * roughly half the height keeps the shape — ordered, one-way, five stops — and
 * moves the commands into a panel under the track, one stage at a time.
 *
 * The track runs exactly once, when it first scrolls into view, and then stops —
 * a deploy runs once, so the animation does too. Ambient motion would say
 * something untrue about the thing being drawn.
 *
 * The drawn track is decoration (`aria-hidden`); the stages are buttons in an
 * ordered list and the full details are repeated in the caption, so nothing is
 * only available to a pointer.
 */
export function DeliveryPipeline({
  stages,
  trigger,
  caption,
}: {
  stages: PipelineStage[];
  trigger: string;
  caption: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const [runProgress, setRunProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const panelId = `${useId()}-stage-detail`;

  /*
    Derived, not stored: reduced motion settles the track immediately and does
    not wait to be scrolled into view. The run is the only thing scrolling gates,
    and someone who will never see it should not be left looking at an unlit rail.
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

  /*
    Markers sit at the centre of equal columns, so the track spans from the first
    centre to the last: half a column inset at each end. Same construction as the
    durability loop, which insets to its outer columns' centres for the same reason.
  */
  const inset = 100 / (stages.length * 2);
  const span = 100 - inset * 2;

  // Progress in stage units: 2.4 means the run is 40% of the way from 03 to 04.
  const head = progress * lastIndex;
  const detail = active === null ? null : stages[active];

  return (
    <figure ref={ref} className="m-0" onMouseLeave={() => setActive(null)}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-mono text-xs text-fg/50">
          <span className="text-accent-1">$</span> {trigger}
        </p>
        <p className="font-mono text-[11px] text-fg/35">{caption}</p>
      </div>

      <div className="relative">
        {/* The track, drawn behind the markers and centred on them. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[18px]">
          <div
            className="absolute h-px -translate-y-1/2 bg-rail"
            style={{ left: `${inset}%`, right: `${inset}%` }}
          />
          {/*
            The full gradient is always laid down across the whole track and
            revealed by a clip — a gradient on an element that grows would
            compress its own stops as the run advances.
          */}
          <div
            className="absolute h-px -translate-y-1/2"
            style={{
              left: `${inset}%`,
              right: `${inset}%`,
              backgroundImage: `linear-gradient(to right, ${stages
                .map((s) => `var(--color-accent-${s.accent})`)
                .join(", ")})`,
              clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
            }}
          />
          {progress > 0 && progress < 1 ? (
            <span
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg shadow-[0_0_8px_2px_rgba(229,229,229,0.5)]"
              style={{ left: `${inset + span * progress}%` }}
            />
          ) : null}
        </div>

        <ol
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
        >
          {stages.map((stage, i) => (
            <li key={stage.number} className="min-w-0">
              <PipelineNode
                stage={stage}
                lit={head >= i}
                active={active === i}
                panelId={panelId}
                onActivate={() => setActive(i)}
              />
            </li>
          ))}
        </ol>
      </div>

      {/*
        Fixed floor so the section does not jump as stages are hovered. The empty
        state is a line of instruction rather than blank space, for the same reason.
      */}
      <div
        id={panelId}
        className="mt-6 min-h-[104px] rounded-xl border border-border bg-surface p-4 sm:min-h-[84px]"
      >
        {detail ? (
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-fg/70">
                {detail.number} {detail.label}
              </p>
              {detail.runner ? (
                <p className="font-mono text-[11px] text-fg/45">{detail.runner}</p>
              ) : null}
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {detail.artifacts.map((artifact) => (
                <li
                  key={artifact}
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] tabular-nums ${accentChip[detail.accent]}`}
                >
                  {artifact}
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-xs leading-relaxed text-fg/60">{detail.annotation}</p>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted">
            Five stages, one way, once per merge to <span className="font-mono text-fg/60">main</span>.
            Pick a stage to see the commands it runs, or read the{" "}
            <span className="font-mono text-fg/60">release.yml</span> walkthrough in the write-up.
          </p>
        )}
      </div>

      <figcaption className="sr-only">
        The delivery path, in order:{" "}
        {stages
          .map((s) => `${s.label} — ${s.artifacts.join(", ")}. ${s.annotation}`)
          .join(" Then ")}
      </figcaption>
    </figure>
  );
}
