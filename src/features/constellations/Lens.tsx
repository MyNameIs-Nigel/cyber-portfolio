"use client";

import type { ReactNode, RefObject } from "react";
import { LENS_DESIGN_PX } from "./constellations.constants";
import { FOCUS_SCALE } from "./optics";

export interface LensRefs {
  rootRef: RefObject<HTMLDivElement | null>;
  backgroundRef: RefObject<HTMLCanvasElement | null>;
  foregroundRef: RefObject<HTMLCanvasElement | null>;
  opticsRef: RefObject<HTMLDivElement | null>;
  detailsRef: RefObject<HTMLDivElement | null>;
  ringRef: RefObject<SVGGElement | null>;
  progressRef: RefObject<SVGCircleElement | null>;
  readoutRef: RefObject<HTMLDivElement | null>;
  readoutTextRef: RefObject<HTMLSpanElement | null>;
}

const L = LENS_DESIGN_PX;
const C = L / 2;
/** Degrees between engravings on the focus ring; the ring turns 8 steps from 0.5 m to ∞. */
const SCALE_STEP = 17;

/** Rounded, so the server's trig and the browser's agree to the last digit and hydration matches. */
function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 100) / 100;
  return [round(C + r * Math.cos(a)), round(C + r * Math.sin(a))];
}

/**
 * The spyglass (or, on touch screens, the viewfinder). It is drawn once at
 * design size and the sky engine moves, scales and defocuses it every frame
 * through these refs, so nothing here re-renders while you sweep.
 */
export function Lens({
  rootRef,
  backgroundRef,
  foregroundRef,
  opticsRef,
  detailsRef,
  ringRef,
  progressRef,
  readoutRef,
  readoutTextRef,
  accent,
  children,
}: LensRefs & { accent: string; children: ReactNode }) {
  const knurls = Array.from({ length: 64 }, (_, i) => 155 + i * 2.9);
  const ticks = Array.from({ length: (FOCUS_SCALE.length - 1) * 2 + 1 }, (_, i) => i * (SCALE_STEP / 2));

  return (
    <>
      <div
        ref={rootRef}
        aria-hidden
        data-locked="false"
        className="pointer-events-none absolute left-0 top-0 z-30 opacity-0 will-change-transform"
        style={{ width: L, height: L, transformOrigin: "50% 50%", ["--lens-accent" as string]: accent }}
      >
        <div className="absolute -inset-[34px] rounded-full shadow-[0_40px_90px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.03)]" />

        <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_42%,#0e1530_0%,#070a16_62%,#030409_100%)]">
          <canvas ref={backgroundRef} className="absolute inset-0 h-full w-full" />
          <div ref={opticsRef} className="absolute inset-0 origin-center">
            <canvas ref={foregroundRef} className="absolute inset-0 h-full w-full" />
            <div ref={detailsRef} className="absolute inset-0 opacity-0">
              {children}
            </div>
          </div>
          {/* Eyepiece vignette, glass reflections and the lock glint. These stay sharp. */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_70px_22px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.1)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_48%_30%_at_32%_18%,rgba(190,210,255,0.13),transparent_70%)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_30%_14%_at_70%_88%,rgba(255,170,120,0.06),transparent_70%)]" />
          <div className="lens-glint absolute -inset-1/4" />
        </div>

        <svg
          className="absolute overflow-visible"
          style={{ left: -34, top: -34 }}
          width={L + 68}
          height={L + 68}
          viewBox={`-34 -34 ${L + 68} ${L + 68}`}
        >
          <defs>
            <linearGradient id="lens-barrel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a404d" />
              <stop offset="0.35" stopColor="#151820" />
              <stop offset="0.7" stopColor="#0b0d12" />
              <stop offset="1" stopColor="#262a34" />
            </linearGradient>
            <linearGradient id="lens-ring" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1d212a" />
              <stop offset="1" stopColor="#0c0e13" />
            </linearGradient>
          </defs>

          {/* Reticle: a broken crosshair and four ticks, in the eyepiece's focal plane. */}
          <g stroke="rgba(235,240,255,0.22)" strokeWidth="0.8" fill="none">
            <path d={`M${C - 64} ${C}H${C - 16}M${C + 16} ${C}H${C + 64}M${C} ${C - 64}V${C - 16}M${C} ${C + 16}V${C + 64}`} />
            <circle cx={C} cy={C} r="1.4" fill="rgba(235,240,255,0.45)" stroke="none" />
            {[0, 90, 180, 270].map((deg) => {
              const [x0, y0] = polar(C - 22, deg);
              const [x1, y1] = polar(C - 10, deg);
              return <line key={deg} x1={x0} y1={y0} x2={x1} y2={y1} />;
            })}
          </g>

          {/* Barrel. */}
          <circle cx={C} cy={C} r={C + 14} fill="none" stroke="url(#lens-barrel)" strokeWidth="28" />
          <circle cx={C} cy={C} r={C + 28.5} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <circle cx={C} cy={C} r={C + 0.5} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />

          {/* The focus ring turns: knurled grip, distance scale, ∞ last. */}
          <g ref={ringRef}>
            <circle cx={C} cy={C} r={C + 14} fill="none" stroke="url(#lens-ring)" strokeWidth="22" />
            <g fill="rgba(255,255,255,0.08)">
              {knurls.map((deg) => {
                const [x, y] = polar(C + 14, deg);
                return <rect key={deg} x={x - 0.8} y={y - 7} width="1.6" height="14" transform={`rotate(${deg} ${x} ${y})`} />;
              })}
            </g>
            <g stroke="rgba(230,235,255,0.35)" strokeWidth="1">
              {ticks.map((deg, i) => {
                const [x0, y0] = polar(C + 4, deg);
                const [x1, y1] = polar(C + (i % 2 ? 7 : 9), deg);
                return <line key={deg} x1={x0} y1={y0} x2={x1} y2={y1} />;
              })}
            </g>
            {FOCUS_SCALE.map((label, i) => {
              const deg = i * SCALE_STEP;
              const [x, y] = polar(C + 17, deg);
              const infinity = label === "∞";
              return (
                <text
                  key={label}
                  x={x}
                  y={y}
                  transform={`rotate(${deg} ${x} ${y})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-mono"
                  style={{ fontSize: infinity ? 15 : 9, fill: infinity ? "var(--lens-accent)" : "rgba(230,235,255,0.62)" }}
                >
                  {label}
                </text>
              );
            })}
          </g>

          {/* Fixed index mark, and the hold-progress arc just inside the glass. */}
          <path d={`M${C - 5} ${-31} L${C + 5} ${-31} L${C} ${-23} Z`} style={{ fill: "var(--lens-accent)" }} />
          <circle
            ref={progressRef}
            cx={C}
            cy={C}
            r={207}
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 207}
            strokeDashoffset={2 * Math.PI * 207}
            transform={`rotate(-90 ${C} ${C})`}
            style={{ stroke: "var(--lens-accent)", filter: "drop-shadow(0 0 6px var(--lens-accent))" }}
          />
        </svg>
      </div>

      <div
        ref={readoutRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 whitespace-nowrap rounded-full border border-white/10 bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70 opacity-0 backdrop-blur-md"
      >
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: accent }} />
        <span ref={readoutTextRef} />
      </div>
    </>
  );
}
