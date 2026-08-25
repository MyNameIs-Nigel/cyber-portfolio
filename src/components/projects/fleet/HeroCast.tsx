"use client";

import { useRef } from "react";
import { ArcadeScreen } from "@/features/arcade-demo/ArcadeScreen";
import { LOOP_LABEL, STRIP } from "@/features/arcade-demo/arcadeDemo.constants";
import { useArcadeDemo } from "@/features/arcade-demo/useArcadeDemo";

/**
 * The hero: a run of the arcade, in terminal chrome, above everything else.
 *
 * The section used to open with `git push` and a five-stage CI diagram, which
 * meant a reader scrolled two thousand pixels of delivery infrastructure without
 * ever seeing a game. This is the correction: the first thing on the page is the
 * thing the page is about.
 *
 * It is generated rather than recorded or playable. A cast file is a video of a
 * terminal — it cannot reflow, so it either overflows the frame or shrinks below
 * reading size, and it goes stale the moment the game's UI moves. A playable
 * embed would mean a second public entry point to harden, and the whole argument
 * of the section is that there is exactly one. This draws the real TUI in the
 * DOM from the game's real numbers, sized to whatever space the section gives it.
 *
 * The window title tracks the run the way a terminal's does — zsh, then the
 * arcade, then the cabinet — because the title bar changing is half of what
 * makes an SSH session feel like somewhere you went.
 */
export function HeroCast() {
  const ref = useRef<HTMLElement>(null);
  const frame = useArcadeDemo(ref);

  return (
    <figure
      ref={ref}
      className="m-0 overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/20"
    >
      <div className="relative flex items-center justify-center border-b border-border px-4 py-3">
        <div className="absolute left-4 flex items-center gap-2" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-accent-2/70" />
          <span className="h-3 w-3 rounded-full bg-accent-1/70" />
        </div>
        <span className="truncate pl-16 font-mono text-[11px] text-muted sm:text-xs">
          {frame.title}
        </span>
      </div>

      <div
        className="relative aspect-[4/3] sm:aspect-[16/10]"
        role="img"
        aria-label="A recreation of a session on play.ssharcade.dev: connecting over SSH, choosing Idle Farmer from the arcade menu, harvesting a ripe turnip, planting a carrot, and checking the leaderboard."
      >
        <ArcadeScreen frame={frame} />
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-3 font-mono text-[11px] text-fg/45">
        {STRIP.map((scene, i) => (
          <span key={scene} className="inline-flex items-center gap-2">
            {i > 0 ? <span className="text-fg/25">→</span> : null}
            <span className={i === frame.strip ? "text-accent-1" : undefined}>{scene}</span>
          </span>
        ))}
        <span className="ml-auto tabular-nums text-fg/35">{LOOP_LABEL} · loops</span>
      </figcaption>
    </figure>
  );
}
