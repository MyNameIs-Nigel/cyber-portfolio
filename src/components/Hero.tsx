"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LiveClock } from "@/components/LiveClock";

const ROLES = [
  "DevOps Engineer",
  "Cloud Security",
  "IaC Automation",
  "Cybersecurity Student",
];

/** SSR-safe subscription to the user's reduced-motion preference. */
function usePrefersReducedMotion() {
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

/**
 * Typewriter effect that types out each word, holds, deletes, then advances.
 * Every state update is scheduled inside a timeout callback so nothing mutates
 * state synchronously within the effect. Falls back to a static word when the
 * user prefers reduced motion.
 */
function useTypewriter(words: string[], reduce: boolean) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const current = words[wordIndex % words.length];

    let delay: number;
    let action: () => void;

    if (!deleting && text === current) {
      delay = 1500;
      action = () => setDeleting(true);
    } else if (deleting && text === "") {
      delay = 400;
      action = () => {
        setDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      };
    } else {
      const next = deleting
        ? current.slice(0, text.length - 1)
        : current.slice(0, text.length + 1);
      delay = deleting ? 35 : 75;
      action = () => setText(next);
    }

    const id = window.setTimeout(action, delay);
    return () => window.clearTimeout(id);
  }, [text, deleting, wordIndex, words, reduce]);

  return reduce ? words[0] : text;
}

export function Hero() {
  const reduce = usePrefersReducedMotion();
  const role = useTypewriter(ROLES, reduce);

  return (
    <section className="relative mb-10 overflow-hidden rounded-xl border border-border bg-surface">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-64 w-[130%] -translate-x-1/2 rounded-full bg-accent-1/10 blur-3xl"
      />

      {/* terminal title bar */}
      <div className="relative flex items-center gap-2 border-b border-border bg-bg/40 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" aria-hidden />
        <span className="h-3 w-3 rounded-full bg-accent-2/80" aria-hidden />
        <span className="h-3 w-3 rounded-full bg-accent-1/80" aria-hidden />
        <span className="ml-2 font-mono text-xs text-muted">nigel@portfolio: ~</span>
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="select-none font-mono">
          <span className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-accent-1">{">"}</span>
            <span className="ml-2 text-fg">nigel</span>
            <span className="text-muted">.</span>
            <span className="text-fg">smith</span>
          </span>
        </div>

        <p className="mt-3 font-mono text-base text-muted sm:text-lg">
          <span className="text-accent-4">~/role</span>
          <span className="text-muted"> $ </span>
          <span className="text-fg">{role}</span>
          <span
            className="terminal-cursor ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-accent-1"
            aria-hidden
          />
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-1/30 bg-accent-1/10 px-3 py-1 font-medium text-accent-1">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-1 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-1" />
            </span>
            Available for opportunities
          </span>
          <span className="font-mono text-xs text-muted">
            Rexburg, ID · <LiveClock />
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="group rounded-lg border border-accent-1/40 bg-accent-1/10 px-4 py-2 text-sm font-medium text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/20"
          >
            View Projects
            <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors duration-200 hover:border-accent-1/50 hover:text-accent-1"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
