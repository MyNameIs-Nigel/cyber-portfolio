import type { Accent, PipelineStage } from "@/types";
import { accentChip, accentFill, accentRing, accentText } from "./accents";

/**
 * One stage of the delivery path. Numbered, because a deploy genuinely is a
 * sequence and the order carries information the reader needs.
 *
 * `lit` is driven by the rail's single run: a stage stays dim until the deploy
 * reaches it, exactly as it would in a real run.
 *
 * Each stage also draws the segment of rail *below* it, so the track always
 * stops at the next marker's edge instead of being one long line with numbers
 * sitting on top of it.
 */
export function PipelineNode({
  stage,
  lit,
  nextAccent,
  fill,
  dot,
}: {
  stage: PipelineStage;
  lit: boolean;
  /** Accent of the following stage — the segment blends between the two layers. */
  nextAccent: Accent | null;
  /** How far the run has crossed this segment, 0–1. */
  fill: number;
  /** Position of the travelling head within this segment, 0–1, or null. */
  dot: number | null;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex w-9 shrink-0 flex-col items-center self-stretch">
        {/*
          The wash is translucent, so it rides on an opaque ground of its own —
          otherwise the rail would read straight through the number.
        */}
        <span
          className={[
            "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-band font-mono text-[11px] font-semibold tabular-nums transition-colors duration-500",
            lit ? `${accentRing[stage.accent]} ${accentText[stage.accent]}` : "border-border text-fg/40",
          ].join(" ")}
        >
          {lit ? <span aria-hidden className={`absolute inset-0 ${accentFill[stage.accent]}`} /> : null}
          <span className="relative">{stage.number}</span>
        </span>

        {nextAccent ? (
          <span aria-hidden className="relative w-px flex-1 bg-rail">
            <span
              className="absolute inset-x-0 top-0"
              style={{
                height: `${fill * 100}%`,
                backgroundImage: `linear-gradient(to bottom, var(--color-accent-${stage.accent}), var(--color-accent-${nextAccent}))`,
              }}
            />
            {dot === null ? null : (
              <span
                className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg shadow-[0_0_8px_2px_rgba(229,229,229,0.5)]"
                style={{ top: `${dot * 100}%` }}
              />
            )}
          </span>
        ) : null}
      </div>

      <div className={`min-w-0 flex-1 sm:flex sm:gap-6 sm:pt-1.5 ${nextAccent ? "pb-7" : ""}`}>
        <div className="sm:w-36 sm:shrink-0">
          <p
            className={[
              "font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500",
              lit ? accentText[stage.accent] : "text-fg/50",
            ].join(" ")}
          >
            {stage.label}
          </p>
          {stage.runner ? (
            <p className="mt-1 font-mono text-[11px] text-fg/45">{stage.runner}</p>
          ) : null}
        </div>

        <div className="mt-3 min-w-0 flex-1 sm:mt-0">
          <ul className="flex flex-wrap gap-1.5">
            {stage.artifacts.map((artifact) => (
              <li
                key={artifact}
                className={[
                  "rounded-md border px-2 py-1 font-mono text-[11px] tabular-nums transition-colors duration-500",
                  lit ? accentChip[stage.accent] : "border-border bg-surface text-fg/50",
                ].join(" ")}
              >
                {artifact}
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs leading-relaxed text-fg/60">{stage.annotation}</p>
        </div>
      </div>
    </div>
  );
}
