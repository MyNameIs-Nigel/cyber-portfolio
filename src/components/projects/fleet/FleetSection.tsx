import Link from "next/link";
import { Container } from "@/components/Container";
import { Stats } from "@/components/Stats";
import {
  FLEET_CONNECT,
  FLEET_CONNECT_NOTE,
  FLEET_EYEBROW,
  FLEET_HEADLINE,
  FLEET_SUBHEAD,
  FLEET_TRIGGER,
  IDENTITY_BODY,
  IDENTITY_HEADLINE,
  PIPELINE_CAPTION,
  SHIPS_ITSELF,
  fleetCabinets,
  fleetStats,
  pipelineStages,
} from "@/data/fleet";
import { CabinetRow } from "./CabinetRow";
import { ConnectBar } from "./ConnectBar";
import { DeliveryPipeline } from "./DeliveryPipeline";
import { HeroCast } from "./HeroCast";

/**
 * ssharcade on /projects.
 *
 * The band is full-bleed, but the content inside it uses the same `Container` as
 * every other section on the site. The colour change alone marks the section;
 * a second, wider measure inside it only reads as two competing page widths.
 *
 * The section is in the order of a visit: the arcade, the command that opens it,
 * the cabinets behind the door, and what your key means once you are in. Only
 * then the machinery — the rule below the arcade is the hinge, and everything
 * after it answers a question the arcade has already earned. The durability loop
 * and the host topology are on the write-up now: they are answers to the third
 * or fourth question, and they were being asked first.
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
          <h2
            id="fleet-heading"
            className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-3xl"
          >
            {FLEET_HEADLINE}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{FLEET_SUBHEAD}</p>
        </header>

        <div className="mt-8">
          <HeroCast />
        </div>

        <div className="mt-6">
          <ConnectBar command={FLEET_CONNECT} note={FLEET_CONNECT_NOTE} />
        </div>

        <div className="mt-8">
          <CabinetRow cabinets={fleetCabinets} />
        </div>

        {/*
          The one fact that turns three cabinets into one arcade. It was only in
          the docs, which is the wrong place for the answer to "do I lose my save
          when I switch games".
        */}
        <div className="mt-8 max-w-[68ch] border-l-2 border-accent-3/40 pl-4">
          <p className="text-base font-semibold text-fg">{IDENTITY_HEADLINE}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{IDENTITY_BODY}</p>
        </div>

        {/* The hinge. Everything above is the arcade; everything below is how it stays up. */}
        <div className="mt-14 flex items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-rail" />
          <span className="font-mono text-[11px] italic tracking-[0.08em] text-fg/45">
            {SHIPS_ITSELF}
          </span>
          <span className="h-px flex-1 bg-rail" />
        </div>

        <div className="mt-10">
          <DeliveryPipeline
            stages={pipelineStages}
            trigger={FLEET_TRIGGER}
            caption={PIPELINE_CAPTION}
          />
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
