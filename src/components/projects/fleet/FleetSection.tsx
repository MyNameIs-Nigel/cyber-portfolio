import Link from "next/link";
import { Container } from "@/components/Container";
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
 * The band is full-bleed, but the content inside it uses the same `Container` as
 * every other section on the site. The colour change alone marks the section;
 * a second, wider measure inside it only reads as two competing page widths.
 *
 * The stack is drawn three times in three shapes because its three parts are
 * structurally different: the delivery path is a line, durability is a loop,
 * and the host is a nest. Only the line is numbered.
 */
export function FleetSection() {
  return (
    <section
      id="fleet"
      className="scroll-mt-16 border-y border-border bg-band py-14 sm:py-16"
      aria-labelledby="fleet-heading"
    >
      <Container>
        <header className="max-w-[62ch]">
          <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-accent-2">
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

        {/*
          One column. These three are the same kind of object — a full-width
          panel — so side-by-side pairs would only make the second of each pair
          look like a footnote to the first.
        */}
        <div className="mt-12 flex flex-col gap-4">
          {/* The rail shows what the machine does. This is the call behind it. */}
          {fleetDecisions.map((decision) => (
            <article key={decision.label} className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <p className={`font-mono text-[11px] font-semibold tracking-[0.08em] ${accentText[decision.accent]}`}>
                {decision.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-fg">{decision.headline}</h3>
              <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-muted">{decision.body}</p>
              {decision.code ? (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-rail bg-band p-3 font-mono text-[11px] leading-relaxed text-fg/75">
                  <code>{decision.code}</code>
                </pre>
              ) : null}
            </article>
          ))}

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
      </Container>
    </section>
  );
}
