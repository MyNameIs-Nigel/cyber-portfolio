"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting and re-renders when it changes.
 *
 * The server snapshot is `false` so markup matches a motion-capable client on first
 * paint; components that animate should treat `true` as "render the finished state
 * immediately" rather than "play a shorter animation".
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}
