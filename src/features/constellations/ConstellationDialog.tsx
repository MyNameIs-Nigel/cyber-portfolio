"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { H2 } from "@/components/Typography";
import { getInterestById } from "@/data/interests";
import type { Accent, Interest, InterestId } from "@/types";
import { ContactSheet } from "./experiences/ContactSheet";
import { ExperimentBranches } from "./experiences/ExperimentBranches";
import { GaugeCluster } from "./experiences/GaugeCluster";
import { RecordCrate } from "./experiences/RecordCrate";

export interface OpenConstellation {
  id: InterestId;
  /** Where the constellation was on screen when it locked, in client pixels; the view opens out of it. */
  origin: { x: number; y: number };
}

const ACCENT_VAR: Record<Accent, string> = {
  1: "var(--color-accent-1)",
  2: "var(--color-accent-2)",
  3: "var(--color-accent-3)",
  4: "var(--color-accent-4)",
};

const EXPERIENCES: Record<InterestId, (props: { interest: Interest; accent: string }) => ReactNode> = {
  photography: ContactSheet,
  music: RecordCrate,
  coding: ExperimentBranches,
  cars: GaugeCluster,
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

function Panel({ open, onClose }: { open: OpenConstellation; onClose: () => void }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [radius] = useState(() => {
    if (typeof window === "undefined") return 2000;
    const { x, y } = open.origin;
    return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40;
  });
  const interest = getInterestById(open.id)!;
  const accent = ACCENT_VAR[interest.accent];
  const Experience = EXPERIENCES[open.id];
  const at = `${open.origin.x}px ${open.origin.y}px`;

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="constellation-title"
      className="fixed inset-0 z-[80]"
      initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${at})` }}
      animate={reduce ? { opacity: 1 } : { clipPath: `circle(${radius}px at ${at})` }}
      exit={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${at})`, transition: { duration: 0.6, ease: [0.6, 0, 0.8, 0.4] } }}
      transition={{ duration: 0.95, ease: [0.65, 0, 0.25, 1] }}
      style={{ ["--accent" as string]: accent }}
    >
      {/* The zoomed sky shows through, dimmed, with a glow where the constellation was. */}
      <div aria-hidden className="absolute inset-0 bg-[#03040a]/80 backdrop-blur-[3px]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(60% 50% at ${at}, color-mix(in srgb, ${accent} 22%, transparent), transparent 70%)` }}
      />

      <div className="relative h-full overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-[#03040a]/60 px-5 py-3 backdrop-blur-xl sm:px-8">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
            <span style={{ color: accent }}>№ {interest.numeral}</span> · {interest.constellation} — {interest.gloss}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <span aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5">↑</span>
            Back to the sky
          </button>
        </div>

        <motion.div
          className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14"
          initial={reduce ? false : { opacity: 0, y: 26, filter: "blur(8px)" }}
          // A lingering filter would trap the photo enlargement's fixed positioning, so it is cleared once in.
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
          transition={{ delay: reduce ? 0 : 0.45, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <H2 id="constellation-title" className="mt-0! mb-0! text-4xl! font-light! sm:text-5xl!">
                {interest.title}
              </H2>
              <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-white/60">{interest.description}</p>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {interest.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`, color: accent }}
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 sm:mt-12">
            <Experience interest={interest} accent={accent} />
          </div>
          <p className="mt-14 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">
            esc · back to the sky
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function ConstellationDialog({ open, onClose }: { open: OpenConstellation | null; onClose: () => void }) {
  return <AnimatePresence>{open ? <Panel key={open.id} open={open} onClose={onClose} /> : null}</AnimatePresence>;
}
