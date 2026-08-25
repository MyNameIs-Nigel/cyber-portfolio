import { CAST } from "@/data/fleet";

/**
 * The hero: a recorded session, in terminal chrome, above everything else.
 *
 * The section used to open with `git push` and a five-stage CI diagram, which
 * meant a reader scrolled two thousand pixels of delivery infrastructure without
 * ever seeing a game. This is the correction: the first thing on the page is the
 * thing the page is about.
 *
 * A recording rather than a playable embed. Playable would mean a second public
 * entry point to harden for a visual, and the whole argument of the section is
 * that there is exactly one.
 *
 * Until the cast exists, `CAST.src` is null and this renders the frame it will
 * sit in — same chrome, same aspect, same scene strip — so dropping the file in
 * changes one line of data and nothing else moves.
 */
export function HeroCast() {
  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/20">
      <div className="relative flex items-center justify-center border-b border-border px-4 py-3">
        <div className="absolute left-4 flex items-center gap-2" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-accent-2/70" />
          <span className="h-3 w-3 rounded-full bg-accent-1/70" />
        </div>
        <span className="truncate font-mono text-xs text-muted sm:text-sm">{CAST.title}</span>
      </div>

      <div className="relative aspect-[16/10] bg-band sm:aspect-[2/1]">
        {CAST.src ? (
          /*
            Self-hosted player, auto-play and loop, no audio track to mute. It
            mounts client-side, so it lands here as its own component rather
            than turning this whole figure into a client boundary.
          */
          <CastPlayerSlot src={CAST.src} />
        ) : (
          <Placeholder />
        )}
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-3 font-mono text-[11px] text-fg/45">
        {CAST.scenes.map((scene, i) => (
          <span key={scene} className="inline-flex items-center gap-2">
            {i > 0 ? <span className="text-fg/25">→</span> : null}
            {scene}
          </span>
        ))}
        <span className="ml-auto tabular-nums text-fg/35">{CAST.duration} · loops</span>
      </figcaption>
    </figure>
  );
}

/**
 * Stands in for the recording. Deliberately not a fake terminal full of invented
 * output — a mock of gameplay would be a claim about gameplay, and this is a
 * frame waiting for evidence, not evidence.
 */
function Placeholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,var(--color-fg)_0,var(--color-fg)_1px,transparent_1px,transparent_4px)]"
      />
      <span
        aria-hidden
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-accent-1/40 bg-accent-1/10 font-mono text-sm text-accent-1"
      >
        ▶
      </span>
      <p className="relative font-mono text-xs text-fg/55">Recorded gameplay · {CAST.duration}</p>
      <p className="relative max-w-[46ch] text-xs leading-relaxed text-muted">
        The cast is not recorded yet. Until it is, the arcade is one command away — the connect
        string is right below.
      </p>
    </div>
  );
}

/**
 * Placeholder for the player itself. Unreachable while `CAST.src` is null; kept
 * so the branch above reads as the finished shape rather than a TODO.
 */
function CastPlayerSlot({ src }: { src: string }) {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      autoPlay
      loop
      muted
      playsInline
      aria-label="Recorded SSH Arcade session"
    />
  );
}
