"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { experiments } from "@/data/interests";
import type { Experiment, Interest } from "@/types";

/*
 * Coding opens onto a branch graph — which, drawn out, is just another
 * constellation. Shipped side projects fork off main and merge back in;
 * unfinished ones fork off and trail away, still waiting to be merged.
 */

const ROW = 68;
const TRUNK = 20;
const LANE = 56;
const TOP = 30;

const prefix = (e: Experiment) => (e.state === "merged" ? "feat" : "wip");

function useTyped(text: string, reduce: boolean | null): string {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const n = Math.min(text.length, Math.floor((now - start) / 9));
      setCount(n);
      if (n < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, reduce]);
  return reduce ? text : text.slice(0, count);
}

function Terminal({ experiment, accent }: { experiment: Experiment; accent: string }) {
  const reduce = useReducedMotion();
  const branch = `${prefix(experiment)}/${experiment.branch}`;
  const merged = experiment.state === "merged";
  const script = [
    `$ git switch ${branch}`,
    `Switched to branch '${branch}'`,
    `$ cat README.md`,
    `# ${experiment.title}`,
    experiment.description,
    "",
    merged ? "status: merged into main" : "status: open, not merged yet",
  ].join("\n");
  const typed = useTyped(script, reduce);
  const done = typed.length === script.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07080c]/90 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 font-mono text-[10px] tracking-[0.14em] text-white/40">nigel@machina:~/experiments</span>
      </div>
      <pre className="min-h-[230px] whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">
        {typed.split("\n").map((line, i) => (
          <span key={i} className={line.startsWith("$") ? "text-white" : line.startsWith("#") ? "font-semibold text-white" : line.startsWith("status") ? "" : "text-white/60"} style={line.startsWith("status") ? { color: merged ? accent : "#fbbf24" } : undefined}>
            {line}
            {"\n"}
          </span>
        ))}
        {!done ? <span className="terminal-cursor">▍</span> : null}
      </pre>
      <div className="flex min-h-[52px] items-center border-t border-white/5 px-5 py-3">
        {experiment.href && done ? (
          <Link href={experiment.href} className="font-mono text-[11px] uppercase tracking-[0.2em] hover:text-white" style={{ color: accent }}>
            Open {experiment.title} →
          </Link>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
            {merged ? "You're standing in it." : "Nothing to open yet."}
          </span>
        )}
      </div>
    </div>
  );
}

export function ExperimentBranches({ accent }: { interest: Interest; accent: string }) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const select = (i: number) => {
    setSelected(i);
    // Stacked layout: bring the terminal up so the README is visible.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      terminalRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }
  };
  const height = TOP + experiments.length * ROW + 20;
  const merged = experiments.filter((e) => e.state === "merged").length;
  const delay = (i: number) => (reduce ? 0 : 0.6 + i * 0.12);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-12">
      <div>
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          git log --graph · {merged} merged · {experiments.length - merged} still open
        </p>
        <div className="relative" style={{ height }}>
          <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width={LANE + 20} height={height}>
            <defs>
              <linearGradient id="branch-fade" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#fbbf24" stopOpacity="0.7" />
                <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* main */}
            <motion.line
              x1={TRUNK}
              y1={6}
              x2={TRUNK}
              y2={height}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.5"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: reduce ? 0 : 0.45, duration: 1.2, ease: "easeInOut" }}
            />
            <circle cx={TRUNK} cy={6} r="4" fill="white" />
            {experiments.map((e, i) => {
              const y = TOP + i * ROW + ROW / 2;
              const isMerged = e.state === "merged";
              const color = isMerged ? accent : "#fbbf24";
              const active = i === selected;
              return (
                <g key={e.branch}>
                  <motion.path
                    d={`M${TRUNK} ${y + 30} C${TRUNK} ${y + 14} ${LANE} ${y + 20} ${LANE} ${y + 5}`}
                    fill="none"
                    stroke={color}
                    strokeOpacity={0.6}
                    strokeWidth="1.5"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: delay(i), duration: 0.45 }}
                  />
                  {isMerged ? (
                    <motion.path
                      d={`M${LANE} ${y - 5} C${LANE} ${y - 20} ${TRUNK} ${y - 14} ${TRUNK} ${y - 30}`}
                      fill="none"
                      stroke={color}
                      strokeOpacity={0.6}
                      strokeWidth="1.5"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: delay(i) + 0.4, duration: 0.45 }}
                    />
                  ) : (
                    <motion.path
                      d={`M${LANE} ${y - 6} L${LANE} ${y - 34}`}
                      fill="none"
                      stroke="url(#branch-fade)"
                      strokeWidth="1.5"
                      strokeDasharray="2 4"
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: delay(i) + 0.4, duration: 0.6 }}
                    />
                  )}
                  <motion.g
                    initial={reduce ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: delay(i) + 0.3, type: "spring", stiffness: 320, damping: 18 }}
                    style={{ transformOrigin: `${LANE}px ${y}px` }}
                  >
                    <circle cx={LANE} cy={y} r={active ? 14 : 9} fill={color} opacity={active ? 0.18 : 0.1} style={{ transition: "r 0.3s" }} />
                    <circle cx={LANE} cy={y} r={isMerged ? 4.5 : 4} fill={isMerged ? color : "#07080c"} stroke={color} strokeWidth={isMerged ? 0 : 1.5} />
                    {active ? <circle cx={LANE} cy={y} r="1.6" fill="white" /> : null}
                  </motion.g>
                </g>
              );
            })}
          </svg>

          <ul className="absolute inset-y-0 right-0" style={{ left: LANE + 26, top: TOP }}>
            {experiments.map((e, i) => {
              const isMerged = e.state === "merged";
              const active = i === selected;
              return (
                <motion.li
                  key={e.branch}
                  style={{ height: ROW }}
                  initial={reduce ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay(i) + 0.2, duration: 0.4 }}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => select(i)}
                    className={`flex h-full w-full flex-col justify-center rounded-xl px-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                      active ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px]" style={{ color: isMerged ? accent : "#fbbf24" }}>
                        {prefix(e)}/{e.branch}
                      </span>
                      {i === 0 ? <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">HEAD</span> : null}
                    </span>
                    <span className="mt-0.5 flex items-baseline gap-2 text-sm text-white/85">
                      {e.title}
                      <span className="text-[11px] text-white/35">{isMerged ? "merged" : "open · unfinished"}</span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>

      <div ref={terminalRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={experiments[selected].branch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <Terminal experiment={experiments[selected]} accent={accent} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
