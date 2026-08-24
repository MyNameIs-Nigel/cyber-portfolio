import type { RecoveryStep } from "@/types";
import { accentArrowUp, accentChip } from "./accents";

/**
 * The loop: durability. Drawn as a cycle rather than a line because it never
 * completes — replication runs continuously and the restore closes the circle on
 * every boot. Deliberately unnumbered: a loop has no first step.
 *
 * Geometry is CSS rather than SVG so nothing distorts as the card resizes. The
 * forward run and the return path are both inset to the outer columns' centres
 * (a third of the width, halved) so the circuit visibly closes on the same two
 * points.
 */
export function RecoveryLoop({
  steps,
  caption,
  limitation,
}: {
  steps: RecoveryStep[];
  caption: string;
  limitation: string;
}) {
  const forward = steps.slice(0, -1);
  const back = steps[steps.length - 1];

  return (
    <figure className="m-0 flex flex-col rounded-xl border border-border bg-surface p-5 sm:p-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-4">
        Durability
      </p>
      <h3 className="mt-2 text-lg font-semibold text-fg">The instance is disposable</h3>

      <div aria-hidden className="mt-7">
        {/* Forward run. The track sits behind the chips at their vertical centre. */}
        <div className="relative">
          <div className="absolute left-[16.67%] right-[16.67%] top-[13px] h-px bg-rail" />
          <div className="relative grid grid-cols-3">
            {forward.map((step) => (
              <div key={step.label} className="flex flex-col items-center px-1 text-center">
                <span className="rounded-md bg-surface">
                  <span className={`block rounded-md border px-2 py-1 font-mono text-[11px] ${accentChip[step.accent]}`}>
                    {step.label}
                  </span>
                </span>
                <span className="mt-2 text-[11px] leading-snug text-fg/45">{step.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Return path: down the right, back along the bottom, up into the first step. */}
        <div className="relative mx-[16.67%] mt-3 h-11">
          <div className="absolute inset-0 rounded-b-lg border-b border-l border-r border-rail" />
          <span
            className={`absolute -left-[4px] -top-1 h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent ${accentArrowUp[back.accent]}`}
          />
          <span className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface px-2 font-mono text-[11px] text-fg/60">
            {back.label} {back.detail}
          </span>
        </div>
      </div>

      <figcaption className="mt-8 space-y-3">
        <p className="text-sm leading-relaxed text-muted">{caption}</p>
        <p className="border-l-2 border-rail pl-3 text-xs leading-relaxed text-fg/50">{limitation}</p>
      </figcaption>
    </figure>
  );
}
