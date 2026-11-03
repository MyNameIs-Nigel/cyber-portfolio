"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DIAL_TRAVEL_PX } from "./constellations.constants";
import { FOCUS_SCALE } from "./optics";

/** How far past either end the ring gives before it stops, like a real barrel hitting its stop. */
const OVERTRAVEL = 34;

/**
 * The touch-screen focus ring: a knurled barrel you drag sideways. The
 * distance scale slides under a fixed index mark, and ∞ arriving at the mark
 * is what brings the constellation sharp. Remount it (via `key`) to reset.
 */
export function FocusDial({ accent, onFocus }: { accent: string; onFocus: (focus: number) => void }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; start: number } | null>(null);
  const offset = useRef(0);
  const [value, setValue] = useState(0);

  const apply = useCallback(
    (next: number) => {
      // Rubber-band past the stops.
      const min = -DIAL_TRAVEL_PX;
      let o = next;
      if (o > 0) o = OVERTRAVEL * Math.tanh(o / OVERTRAVEL);
      if (o < min) o = min - OVERTRAVEL * Math.tanh((min - o) / OVERTRAVEL);
      offset.current = o;
      if (stripRef.current) stripRef.current.style.transform = `translate3d(${o}px, 0, 0)`;
      const focus = Math.min(1, Math.max(0, -o / DIAL_TRAVEL_PX));
      onFocus(focus);
      setValue(Math.round(focus * 100));
    },
    [onFocus],
  );

  const settle = () => {
    // Spring back inside the stops on release.
    apply(Math.min(0, Math.max(-DIAL_TRAVEL_PX, offset.current)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone; the drag still works while it stays on the ring.
    }
    drag.current = { id: e.pointerId, x: e.clientX, start: offset.current };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    apply(d.start + (e.clientX - d.x));
  };
  const onPointerUp = () => {
    drag.current = null;
    settle();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = DIAL_TRAVEL_PX / 10;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") apply(Math.max(-DIAL_TRAVEL_PX, offset.current - step));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") apply(Math.min(0, offset.current + step));
    else if (e.key === "End") apply(-DIAL_TRAVEL_PX);
    else if (e.key === "Home") apply(0);
    else return;
    e.preventDefault();
  };

  const spacing = DIAL_TRAVEL_PX / (FOCUS_SCALE.length - 1);

  return (
    <div className="flex w-full max-w-[360px] flex-col items-center gap-2">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Focus ring"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={value >= 100 ? "In focus" : `${value}% focused`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative h-[58px] w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d13] shadow-[0_18px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:cursor-grabbing"
      >
        <div ref={stripRef} className="absolute inset-y-0 left-1/2 will-change-transform">
          {/* Knurled grip. */}
          <div
            className="absolute bottom-0 top-[26px]"
            style={{
              left: -420,
              width: DIAL_TRAVEL_PX + 840,
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 2px, rgba(0,0,0,0.35) 2px 4px, transparent 4px 7px)",
            }}
          />
          {FOCUS_SCALE.map((label, i) => (
            <span
              key={label}
              className="absolute top-[7px] -translate-x-1/2 font-mono leading-none"
              style={{
                left: i * spacing,
                fontSize: label === "∞" ? 15 : 10,
                color: label === "∞" ? accent : "rgba(230,235,255,0.6)",
              }}
            >
              {label}
            </span>
          ))}
          {Array.from({ length: (FOCUS_SCALE.length - 1) * 2 + 1 }, (_, i) => (
            <span
              key={i}
              className="absolute top-[20px] w-px -translate-x-1/2 bg-white/30"
              style={{ left: (i * spacing) / 2, height: i % 2 ? 3 : 5 }}
            />
          ))}
        </div>
        {/* Cylinder shading, so the strip reads as a barrel turning rather than a slider. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,10,0.95),rgba(5,6,10,0.1)_32%,rgba(255,255,255,0.03)_50%,rgba(5,6,10,0.1)_68%,rgba(5,6,10,0.95))]" />
        <span
          className="pointer-events-none absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[7px] border-x-transparent"
          style={{ borderTopColor: accent }}
        />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">
        <span className="dial-nudge inline-block">‹‹</span> drag the ring to focus
      </p>
    </div>
  );
}
