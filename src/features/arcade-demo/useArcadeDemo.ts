"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { frameAt, STILL_AT } from "./arcadeDemo.frame";
import type { DemoFrame } from "./arcadeDemo.types";

const TICK_MS = 120;
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Drives the loop.
 *
 * The clock only runs while the window is on screen and the visitor has not
 * asked for less motion. Everything else is `frameAt` — see the note there for
 * why the run is a function of the clock rather than an accumulating machine.
 */
export function useArcadeDemo(scope: RefObject<HTMLElement | null>): DemoFrame {
  const [elapsed, setElapsed] = useState(STILL_AT);
  const offsetRef = useRef(0);

  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    /* Reduced motion: leave the clock at its initial frame and never start it. */
    if (window.matchMedia(REDUCED_QUERY).matches) return;

    let timer: number | null = null;

    const start = () => {
      if (timer !== null) return;
      /*
        Resume where the run left off rather than where the wall clock got to.
        A visitor who scrolls back up should find the scene they left, not a
        game that carried on without them.
      */
      const origin = performance.now() - offsetRef.current;
      timer = window.setInterval(() => {
        const next = performance.now() - origin;
        offsetRef.current = next;
        setElapsed(next);
      }, TICK_MS);
    };

    const stop = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "128px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [scope]);

  return frameAt(elapsed);
}

/** Full-width layout needs this many columns; the trimmed one needs this many. */
const FULL_COLS = 102;
const COMPACT_COLS = 60;
/** Below this many pixels the full layout can no longer be read. */
const COMPACT_BELOW = 560;
/** Monospace advance width, as a fraction of the font size. */
const CH = 0.6;

export interface TerminalFit {
  fontSize: number;
  compact: boolean;
}

/**
 * Sizes the type so a fixed number of columns always fits the window.
 *
 * The screen is a terminal, so the thing that must not break is the line: every
 * label, bar and keybinding footer is written to a column budget, and the font
 * size is whatever makes that budget fit the space the section gives it. Below
 * `COMPACT_BELOW` no readable size fits the full budget, so the layout switches
 * to the trimmed one instead of shrinking into illegibility.
 */
export function useTerminalFit(ref: RefObject<HTMLElement | null>): TerminalFit {
  /*
    The starting values are what the server renders and what a visitor without
    JavaScript keeps. `useLayoutEffect` corrects them before the first paint, so
    the only cost of guessing is a clipped frame in the no-JS case — better than
    a blank one.
  */
  const [fit, setFit] = useState<TerminalFit>({ fontSize: 12, compact: false });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const width = node.clientWidth;
      if (!width) return;
      const compact = width < COMPACT_BELOW;
      const raw = width / ((compact ? COMPACT_COLS : FULL_COLS) * CH);
      const fontSize = Math.max(9, Math.min(compact ? 13 : 15, raw));
      setFit((prev) =>
        prev.compact === compact && Math.abs(prev.fontSize - fontSize) < 0.05
          ? prev
          : { fontSize, compact },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return fit;
}
