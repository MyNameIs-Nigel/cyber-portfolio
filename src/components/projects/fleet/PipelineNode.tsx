import type { PipelineStage } from "@/types";
import { accentFill, accentRing, accentText } from "./accents";

/**
 * One marker on the delivery track.
 *
 * Numbered, because a deploy genuinely is a sequence and the order carries
 * information. `lit` is driven by the rail's single run: a stage stays dim until
 * the deploy reaches it, exactly as it would in a real run.
 *
 * The marker carries only its number and label now. The commands each stage runs
 * are the best evidence in the section, but five stacked command lists made the
 * pipeline the tallest thing on the page — so they moved into a panel this
 * button opens, and into the write-up, where they are prose rather than a
 * diagram. The button is the affordance for both.
 */
export function PipelineNode({
  stage,
  lit,
  active,
  panelId,
  onActivate,
}: {
  stage: PipelineStage;
  lit: boolean;
  active: boolean;
  /** The shared detail panel this marker fills in. */
  panelId: string;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={active}
      aria-controls={panelId}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      className="flex w-full flex-col items-center gap-2 px-0.5 text-center focus:outline-none focus-visible:outline-none"
    >
      {/*
        The wash is translucent, so it rides on an opaque ground of its own —
        otherwise the track would read straight through the number.
      */}
      <span
        className={[
          "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-band font-mono text-[11px] font-semibold tabular-nums transition-colors duration-300",
          lit ? `${accentRing[stage.accent]} ${accentText[stage.accent]}` : "border-border text-fg/40",
          active ? "ring-2 ring-fg/25 ring-offset-2 ring-offset-band" : "",
        ].join(" ")}
      >
        {lit ? <span aria-hidden className={`absolute inset-0 ${accentFill[stage.accent]}`} /> : null}
        <span className="relative">{stage.number}</span>
      </span>

      <span
        className={[
          "font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] transition-colors duration-300 sm:text-[11px] sm:tracking-[0.18em]",
          lit ? accentText[stage.accent] : "text-fg/50",
        ].join(" ")}
      >
        {stage.label}
      </span>
    </button>
  );
}
