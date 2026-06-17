"use client";

import { useEffect, useRef, useState } from "react";
import type { Accent } from "@/types";

export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  accent: Accent;
}

const valueColor: Record<Accent, string> = {
  1: "text-accent-1",
  2: "text-accent-2",
  3: "text-accent-3",
  4: "text-accent-4",
};

const hoverBorder: Record<Accent, string> = {
  1: "hover:border-accent-1/50",
  2: "hover:border-accent-2/50",
  3: "hover:border-accent-3/50",
  4: "hover:border-accent-4/50",
};

function StatItem({ stat, run }: { stat: Stat; run: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!run) return;
    // Jump straight to the final value when the user prefers reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setDisplay(stat.value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(stat.value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setDisplay(stat.value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, stat.value]);

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 transition-colors duration-200 ${hoverBorder[stat.accent]}`}
    >
      <dd className={`font-mono text-2xl font-bold tabular-nums sm:text-3xl ${valueColor[stat.accent]}`}>
        {stat.prefix}
        {display}
        {stat.suffix}
      </dd>
      <dt className="mt-1 text-xs leading-snug text-muted">{stat.label}</dt>
    </div>
  );
}

export function Stats({ items }: { items: Stat[] }) {
  const ref = useRef<HTMLDListElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <dl ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((stat) => (
        <StatItem key={stat.label} stat={stat} run={run} />
      ))}
    </dl>
  );
}
