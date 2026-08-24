import type { PipelineStage } from "@/types";
import { accentChip, accentDot, accentRing, accentText } from "./accents";

/**
 * One stage of the delivery path. Numbered, because a deploy genuinely is a
 * sequence and the order carries information the reader needs.
 *
 * `lit` is driven by the rail's single run: a stage stays dim until the deploy
 * reaches it, exactly as it would in a real run.
 */
export function PipelineNode({
  stage,
  lit,
  spineLit,
  last,
}: {
  stage: PipelineStage;
  lit: boolean;
  /** Fills the spine segment below this node once the run has moved past it. */
  spineLit: boolean;
  /** The final stage draws no spine — there is nothing after it to connect to. */
  last: boolean;
}) {
  return (
    <div className="flex gap-4 lg:block">
      {/* Marker. On desktop it sits on the rail; on mobile it heads a vertical spine. */}
      <div className="flex flex-col items-center lg:block">
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold tabular-nums transition-colors duration-500",
            lit ? accentRing[stage.accent] : "border-border bg-band text-fg/40",
            lit ? accentText[stage.accent] : "",
          ].join(" ")}
        >
          {stage.number}
        </span>
        {/* Mobile spine segment; the desktop rail is drawn once by the parent. */}
        {last ? null : (
          <span
            aria-hidden
            className={`mt-2 w-px flex-1 transition-colors duration-500 lg:hidden ${
              spineLit ? accentDot[stage.accent] : "bg-rail"
            }`}
          />
        )}
      </div>

      <div className="min-w-0 pb-8 lg:pb-0 lg:pt-4">
        <p
          className={[
            "font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500",
            lit ? accentText[stage.accent] : "text-fg/50",
          ].join(" ")}
        >
          {stage.label}
        </p>

        {stage.runner ? (
          <p className="mt-1.5 font-mono text-[11px] text-fg/45">{stage.runner}</p>
        ) : null}

        <ul className="mt-3 flex flex-wrap gap-1.5">
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

        <p className="mt-3 max-w-[30ch] text-xs leading-relaxed text-fg/60">{stage.annotation}</p>
      </div>
    </div>
  );
}
