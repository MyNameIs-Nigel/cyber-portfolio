import Link from "next/link";
import { Stats } from "@/components/Stats";
import {
  FLEET_EYEBROW,
  FLEET_LEDE,
  FLEET_TITLE,
  FLEET_TRIGGER,
  RECOVERY_CAPTION,
  RECOVERY_LIMIT,
  TOPOLOGY_CAPTION,
  TOPOLOGY_CHAIN,
  fleetDecisions,
  fleetStats,
  pipelineStages,
  recoverySteps,
  topologyNodes,
} from "@/data/fleet";
import { DeliveryPipeline } from "./DeliveryPipeline";
import { HostTopology } from "./HostTopology";
import { RecoveryLoop } from "./RecoveryLoop";
import { accentText } from "./accents";

/**
 * ssharcade — the delivery pipeline.
 *
 * The only full-bleed section on the site. It sits outside the page's 768px
 * Container rather than escaping it with a transform, so there is no `100vw`
 * scrollbar overflow to work around; reading content inside still returns to a
 * comfortable measure.
 *
 * The stack is drawn three times in three shapes because its three parts are
 * structurally different: the delivery path is a line, durability is a loop,
 * and the host is a nest. Only the line is numbered.
 */
export function FleetSection() {
  return (
    <section className="border-y border-border bg-band py-14 sm:py-16" aria-labelledby="fleet-heading">
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <header className="max-w-[62ch]">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-2">
            {FLEET_EYEBROW}
          </p>
          <h2 id="fleet-heading" className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-3xl">
            {FLEET_TITLE}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{FLEET_LEDE}</p>
        </header>

        <div className="mt-12">
          <DeliveryPipeline stages={pipelineStages} trigger={FLEET_TRIGGER} />
        </div>

        {/* The rail shows what the machine does. These are the calls behind it. */}
        <div className="mt-12 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {fleetDecisions.map((decision) => (
            <article key={decision.label} className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <p className={`font-mono text-[11px] font-semibold uppercase tracking-[0.18em] ${accentText[decision.accent]}`}>
                {decision.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-fg">{decision.headline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{decision.body}</p>
              {decision.code ? (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-rail bg-band p-3 font-mono text-[11px] leading-relaxed text-fg/75">
                  <code>{decision.code}</code>
                </pre>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <RecoveryLoop steps={recoverySteps} caption={RECOVERY_CAPTION} limitation={RECOVERY_LIMIT} />
          <HostTopology nodes={topologyNodes} chain={TOPOLOGY_CHAIN} caption={TOPOLOGY_CAPTION} />
        </div>

        <div className="mt-10">
          <Stats items={fleetStats} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/projects/ssh-arcade-fleet"
            className="inline-flex items-center justify-center rounded-xl border border-accent-1/50 bg-accent-1/10 px-4 py-2.5 text-sm font-medium text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-band"
          >
            Read how it is built
          </Link>
          <a
            href="https://ssharcade.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors duration-200 hover:border-accent-1/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-band"
          >
            ssharcade.dev
          </a>
        </div>
      </div>
    </section>
  );
}
