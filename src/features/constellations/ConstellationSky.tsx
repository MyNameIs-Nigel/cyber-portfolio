"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { H1 } from "@/components/Typography";
import { interests } from "@/data/interests";
import type { Accent, InterestId } from "@/types";
import { ConstellationDialog, type OpenConstellation } from "./ConstellationDialog";
import { SKY_HEIGHT_LVH, VIEWFINDER, VISITED_STORAGE_KEY } from "./constellations.constants";
import type { LensMode, SkyLayout } from "./constellations.types";
import { FocusDial } from "./FocusDial";
import { Lens } from "./Lens";
import { SkyEngine } from "./skyEngine";

const ACCENT_VAR: Record<Accent, string> = {
  1: "var(--color-accent-1)",
  2: "var(--color-accent-2)",
  3: "var(--color-accent-3)",
  4: "var(--color-accent-4)",
};

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function readVisited(): InterestId[] {
  try {
    const raw = window.localStorage.getItem(VISITED_STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.filter((id): id is InterestId => interests.some((i) => i.id === id)) : [];
  } catch {
    return [];
  }
}

function writeVisited(ids: InterestId[]): void {
  try {
    window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private mode or storage blocked: the chart just forgets on reload.
  }
}

/**
 * Hobbies as constellations in a night sky you scroll through. On desktop the
 * cursor becomes a spyglass: sweep it over a constellation, press and hold to
 * pull focus, and the telescope swings in to open that hobby. On touch screens
 * a fixed viewfinder does the sweeping as you scroll, and a focus ring under it
 * does the focusing.
 */
export function ConstellationSky() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const raRef = useRef<HTMLSpanElement>(null);
  const decRef = useRef<HTMLSpanElement>(null);
  const magRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const labelsRef = useRef(new Map<InterestId, HTMLElement>());
  const buttonsRef = useRef(new Map<InterestId, HTMLButtonElement>());
  const lensRootRef = useRef<HTMLDivElement>(null);
  const lensBackgroundRef = useRef<HTMLCanvasElement>(null);
  const lensForegroundRef = useRef<HTMLCanvasElement>(null);
  const lensOpticsRef = useRef<HTMLDivElement>(null);
  const lensDetailsRef = useRef<HTMLDivElement>(null);
  const lensRingRef = useRef<SVGGElement>(null);
  const lensProgressRef = useRef<SVGCircleElement>(null);
  const lensReadoutRef = useRef<HTMLDivElement>(null);
  const lensReadoutTextRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<SkyEngine | null>(null);

  const [mode, setMode] = useState<LensMode>("spyglass");
  const [layout, setLayout] = useState<SkyLayout | null>(null);
  const [engagedId, setEngagedId] = useState<InterestId | null>(null);
  const [lensId, setLensId] = useState<InterestId>(interests[0].id);
  const [open, setOpen] = useState<OpenConstellation | null>(null);
  const [visited, setVisited] = useState<InterestId[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const world = worldRef.current;
    const lensRoot = lensRootRef.current;
    const lensBackground = lensBackgroundRef.current;
    const lensForeground = lensForegroundRef.current;
    const lensOptics = lensOpticsRef.current;
    if (!section || !viewport || !canvas || !world || !lensRoot || !lensBackground || !lensForeground || !lensOptics) return;

    setVisited(readVisited());
    const fine = window.matchMedia(FINE_POINTER);
    const initial: LensMode = fine.matches ? "spyglass" : "viewfinder";
    setMode(initial);

    const engine = new SkyEngine(
      {
        section,
        viewport,
        canvas,
        world,
        spotlight: spotlightRef.current,
        lens: {
          root: lensRoot,
          background: lensBackground,
          foreground: lensForeground,
          optics: lensOptics,
          details: lensDetailsRef.current,
          ring: lensRingRef.current,
          progress: lensProgressRef.current,
          readout: lensReadoutRef.current,
          readoutText: lensReadoutTextRef.current,
        },
        hud: { ra: raRef.current, dec: decRef.current, mag: magRef.current, cursor: cursorRef.current },
        labels: labelsRef.current,
      },
      {
        onLayout: setLayout,
        onEngage: (id) => {
          setEngagedId(id);
          if (id) setLensId(id);
        },
        onLock: (id, origin) => {
          setOpen({ id, origin });
          setVisited((prev) => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            writeVisited(next);
            return next;
          });
        },
      },
      interests,
      initial,
    );
    engineRef.current = engine;
    engine.start();

    const onMode = () => {
      const next: LensMode = fine.matches ? "spyglass" : "viewfinder";
      setMode(next);
      engine.setMode(next);
    };
    fine.addEventListener("change", onMode);
    return () => {
      fine.removeEventListener("change", onMode);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Hold the page still while a constellation is open; the sky behind it keeps twinkling.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [open]);

  const close = useCallback(() => {
    const id = open?.id;
    setOpen(null);
    engineRef.current?.release();
    if (id) buttonsRef.current.get(id)?.focus({ preventScroll: true });
  }, [open]);

  const onDialFocus = useCallback((v: number) => engineRef.current?.setDialFocus(v), []);

  const onConstellationClick = (id: InterestId) => (e: MouseEvent<HTMLButtonElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    // detail 0 is a keyboard activation; a tap on a touch screen aims the viewfinder at it.
    if (e.detail === 0) engine.focusFor(id);
    else if (mode === "viewfinder") engine.scrollToConstellation(id);
  };

  const byId = useMemo(() => new Map(interests.map((i) => [i.id, i])), []);
  const lensInterest = byId.get(lensId)!;
  const engaged = engagedId ? byId.get(engagedId) : undefined;
  const spyglass = mode === "spyglass";
  const edge = layout ? Math.max(24, Math.min(112, layout.width * 0.07)) : 24;
  // The focus ring sits just under the engaged viewfinder and its readout.
  const dialTop = layout
    ? layout.height * VIEWFINDER.centerY + Math.min(layout.width - VIEWFINDER.sideMargin * 2, VIEWFINDER.engagedMax) / 2 + 54
    : 0;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="sky-heading"
      className="relative"
      style={{ height: `${SKY_HEIGHT_LVH}lvh` }}
    >
      <div
        ref={viewportRef}
        // `clip`, not `hidden`: a hidden overflow is still a scroll container, and focusing a
        // constellation button would scroll the pinned view instead of the page.
        className={`sticky top-0 h-lvh w-full overflow-clip bg-[radial-gradient(120%_70%_at_50%_0%,#0b1124_0%,#060812_48%,#030408_100%)] ${
          spyglass ? "cursor-none" : ""
        }`}
      >
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

        <div ref={worldRef} className="absolute left-0 top-0 origin-top-left will-change-transform">
          {/* Ease the sky in under the navbar, and blend it into the page below. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[22lvh] bg-gradient-to-b from-bg/80 via-bg/30 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[40lvh] bg-gradient-to-t from-bg via-bg/75 to-transparent" />

          {/* The page heading lives in the sky, so it renders on the server rather than waiting for layout. */}
          <div
            className="absolute left-[clamp(24px,7vw,112px)] right-[clamp(24px,7vw,112px)] top-[max(84px,13lvh)] max-w-[460px] cursor-auto sm:top-[max(96px,17lvh)]"
            onPointerEnter={() => engineRef.current?.setPointerBlocked(true)}
            onPointerLeave={() => engineRef.current?.setPointerBlocked(false)}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">More about Nigel · a field guide</p>
            <H1 id="sky-heading" firstOnPage className="mt-4! mb-0! text-4xl! font-light! leading-[1.05]! sm:text-6xl!">
              A few things
              <br />
              in my orbit.
            </H1>
            <p className="mt-5 max-w-[360px] text-sm leading-relaxed text-white/55">
              The less résumé-shaped part of the site. Four hobbies are hiding in this sky, and each one opens onto something I
              do when I&apos;m away from a cloud console.
            </p>
            <p className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
              <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25">
                <span className="h-1 w-1 rounded-full bg-white/70" />
              </span>
              {spyglass ? "Sweep with the spyglass · press and hold to focus" : "Scroll to sweep · turn the ring to focus"}
            </p>
          </div>

          {layout ? (
            <>

              <div
                className="absolute max-w-[380px] cursor-auto"
                style={{ left: edge, top: layout.worldHeight - layout.height * 0.36 }}
                onPointerEnter={() => engineRef.current?.setPointerBlocked(true)}
                onPointerLeave={() => engineRef.current?.setPointerBlocked(false)}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Charted {visited.length} of {interests.length}
                </p>
                <p className="mt-3 font-serif text-2xl italic leading-snug text-white/70">
                  {visited.length === interests.length ? "That's the whole sky. Thanks for looking up." : "Missed one? The chart on the right remembers."}
                </p>
              </div>

              {layout.constellations.map((c) => {
                const interest = byId.get(c.id)!;
                const labelX = Math.min(layout.width - 210, Math.max(16, c.x - c.radius * 0.95));
                const isVisited = visited.includes(c.id);
                return (
                  <div key={c.id}>
                    <div
                      ref={(el) => {
                        if (el) labelsRef.current.set(c.id, el);
                        else labelsRef.current.delete(c.id);
                      }}
                      aria-hidden
                      className="pointer-events-none absolute select-none opacity-30"
                      style={{ left: labelX, top: c.y + c.radius * 0.66 }}
                    >
                      <div className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.3em]">
                        <span style={{ color: ACCENT_VAR[interest.accent] }}>{interest.numeral}</span>
                        <span className="text-white/80">{interest.constellation}</span>
                        {isVisited ? <span className="text-white/40">✓</span> : null}
                      </div>
                      <div className="mt-1 font-serif text-sm italic text-white/45">
                        {interest.gloss} · {interest.title.toLowerCase()}
                      </div>
                    </div>
                    <button
                      ref={(el) => {
                        if (el) buttonsRef.current.set(c.id, el);
                        else buttonsRef.current.delete(c.id);
                      }}
                      type="button"
                      aria-label={`${interest.constellation}: ${interest.title}. Press to focus the telescope and open it.`}
                      onFocus={(e) => {
                        if (!e.currentTarget.matches(":focus-visible")) return;
                        engineRef.current?.scrollToConstellation(c.id);
                        engineRef.current?.preview(c.id);
                      }}
                      onBlur={() => engineRef.current?.preview(null)}
                      onClick={onConstellationClick(c.id)}
                      className={`absolute rounded-full outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-8 focus-visible:ring-offset-transparent ${
                        spyglass ? "pointer-events-none" : ""
                      }`}
                      style={{ left: c.x - c.radius, top: c.y - c.radius, width: c.radius * 2, height: c.radius * 2 }}
                    />
                  </div>
                );
              })}
            </>
          ) : null}
        </div>

        {/* Film grain and a soft vignette over the whole frame. */}
        <div aria-hidden className="sky-grain pointer-events-none absolute -inset-[50%] opacity-[0.07] mix-blend-overlay" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
        <div
          ref={spotlightRef}
          aria-hidden
          // Wide enough (half of it reaches past any viewport's diagonal) to dim the whole frame wherever the lens is.
          className="pointer-events-none absolute left-0 top-0 h-[260vmax] w-[260vmax] opacity-0 will-change-transform bg-[radial-gradient(circle,transparent_0,transparent_250px,rgba(2,3,8,0.6)_520px,rgba(2,3,8,0.72)_1200px)]"
        />

        {/* Observatory readouts. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute bottom-5 left-4 space-y-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 transition-opacity duration-500 sm:bottom-7 sm:left-8 sm:text-[10px] ${
            open ? "opacity-0" : ""
          }`}
        >
          <div className="text-white/55">Observatory · ~/about</div>
          <div>
            RA <span ref={raRef} className="text-white/60">04h 24m 00s</span>
          </div>
          <div>
            Dec <span ref={decRef} className="text-white/60">+64° 00′</span>
          </div>
          <div>
            Mag <span ref={magRef} className="text-white/60">×1.0</span>
          </div>
        </div>

        <nav
          aria-label="Constellations"
          onPointerEnter={() => engineRef.current?.setPointerBlocked(true)}
          onPointerLeave={() => engineRef.current?.setPointerBlocked(false)}
          className={`absolute right-2 top-1/2 z-40 h-[50%] w-10 -translate-y-1/2 cursor-auto transition-opacity duration-500 sm:right-5 ${
            open || (!spyglass && engaged) ? "pointer-events-none opacity-0" : ""
          }`}
        >
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          <span ref={cursorRef} aria-hidden className="absolute left-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          {layout?.constellations.map((c) => {
            const interest = byId.get(c.id)!;
            const done = visited.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => engineRef.current?.scrollToConstellation(c.id)}
                aria-label={`Go to ${interest.constellation} (${interest.title})${done ? ", charted" : ""}`}
                className="group absolute left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                style={{ top: `${(c.y / layout.worldHeight) * 100}%` }}
              >
                <span
                  className="h-2 w-2 rotate-45 border transition-transform duration-300 group-hover:scale-150"
                  style={{
                    borderColor: ACCENT_VAR[interest.accent],
                    background: done ? ACCENT_VAR[interest.accent] : "transparent",
                    boxShadow: done ? `0 0 10px ${ACCENT_VAR[interest.accent]}` : undefined,
                  }}
                />
                <span className="pointer-events-none absolute right-9 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-white/0 transition-colors duration-200 group-hover:text-white/70 group-focus-visible:text-white/70">
                  {interest.numeral} · {interest.title}
                </span>
              </button>
            );
          })}
        </nav>

        <Lens
          rootRef={lensRootRef}
          backgroundRef={lensBackgroundRef}
          foregroundRef={lensForegroundRef}
          opticsRef={lensOpticsRef}
          detailsRef={lensDetailsRef}
          ringRef={lensRingRef}
          progressRef={lensProgressRef}
          readoutRef={lensReadoutRef}
          readoutTextRef={lensReadoutTextRef}
          accent={ACCENT_VAR[lensInterest.accent]}
        >
          <div className="absolute inset-x-0 top-[62px] text-center font-mono text-[11px] uppercase tracking-[0.34em] text-white/80">
            <span style={{ color: ACCENT_VAR[lensInterest.accent] }}>{lensInterest.numeral}</span> · {lensInterest.constellation}
          </div>
          <div className="absolute inset-x-[60px] top-[286px] flex flex-col items-center text-center">
            <span className="text-[34px] font-light leading-none tracking-tight text-white">{lensInterest.title}</span>
            <span className="mt-2.5 font-serif text-[16px] italic leading-snug text-white/75">{lensInterest.tagline}</span>
            <span
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em]"
              style={{ color: ACCENT_VAR[lensInterest.accent] }}
            >
              {lensInterest.teaser}
            </span>
          </div>
        </Lens>

        {!spyglass ? (
          <div
            style={{ top: dialTop }}
            className={`absolute inset-x-0 z-40 flex justify-center px-6 transition-all duration-500 ${
              engaged && !open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
            }`}
          >
            {engaged ? <FocusDial key={engaged.id} accent={ACCENT_VAR[engaged.accent]} onFocus={onDialFocus} /> : null}
          </div>
        ) : null}
      </div>

      <ConstellationDialog open={open} onClose={close} />
    </section>
  );
}
