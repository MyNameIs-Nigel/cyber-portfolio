"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { musicRotation } from "@/data/media";
import type { Interest } from "@/types";

/*
 * Music opens onto a turntable and a crate. Pick a sleeve and the arm lifts,
 * the platter spins down, the record swaps, and the needle drops again. The
 * platter really turns at 33⅓ or 45 rpm, and the light on the vinyl stays put
 * while the grooves turn under it.
 */

const SECONDS_PER_REV = { 33: 60 / (100 / 3), 45: 60 / 45 } as const;
type Speed = keyof typeof SECONDS_PER_REV;

/** Tonearm geometry in the plinth's 440×360 viewBox. */
const PIVOT = { x: 392, y: 52 };
const ARM_REST_DEG = -51;

const VINYL = [
  "radial-gradient(circle, transparent 0 33.5%, rgba(255,255,255,0.05) 33.6% 34%, transparent 34.2%)",
  // Gaps between tracks catch the light a little differently.
  "radial-gradient(circle, transparent 0 51.5%, rgba(255,255,255,0.045) 51.7% 52.2%, transparent 52.4% 69%, rgba(255,255,255,0.045) 69.2% 69.7%, transparent 69.9% 85%, rgba(255,255,255,0.04) 85.2% 85.7%, transparent 85.9%)",
  "repeating-radial-gradient(circle, #0a0a0b 0 1.1px, #161618 1.3px 2.5px)",
].join(", ");

function Tonearm({ down, reduce }: { down: boolean; reduce: boolean | null }) {
  const angle = down ? 0 : ARM_REST_DEG;
  const style = {
    transformBox: "view-box" as const,
    transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
    transform: `rotate(${angle}deg)`,
    transition: reduce ? "none" : "transform 1.1s cubic-bezier(0.45, 0, 0.2, 1)",
  };
  // Drawn in the playing position: from the pivot down-left to the headshell.
  const arm = "M392 52 L286 137";
  return (
    <svg aria-hidden viewBox="0 0 440 360" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <linearGradient id="arm-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f3f5" />
          <stop offset="0.5" stopColor="#9da2ab" />
          <stop offset="1" stopColor="#e5e7ea" />
        </linearGradient>
        <radialGradient id="arm-base" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4a4e57" />
          <stop offset="1" stopColor="#15171b" />
        </radialGradient>
      </defs>

      {/* Arm rest. */}
      <rect x="386" y="196" width="12" height="18" rx="3" fill="#24262b" stroke="rgba(255,255,255,0.08)" />

      {/* Shadow, which tightens up as the arm comes down onto the record. */}
      <g style={{ ...style, transform: `${style.transform} translate(${down ? 3 : 9}px, ${down ? 4 : 12}px)`, opacity: down ? 0.45 : 0.3 }}>
        <path d={arm} stroke="black" strokeWidth="7" strokeLinecap="round" style={{ filter: "blur(3px)" }} />
      </g>

      <g style={style}>
        {/* Counterweight behind the pivot. */}
        <rect x="404" y="18" width="22" height="26" rx="4" transform="rotate(-38 415 31)" fill="url(#arm-base)" stroke="rgba(255,255,255,0.12)" />
        <path d={arm} stroke="url(#arm-metal)" strokeWidth="4.2" strokeLinecap="round" />
        {/* Headshell and cartridge, with the stylus at its tip. */}
        <g transform="rotate(-38 282 141)">
          <rect x="270" y="134" width="24" height="13" rx="2" fill="#d9dce1" />
          <rect x="273" y="147" width="14" height="7" rx="1.5" fill="#1d1f23" />
          <rect x="269" y="138" width="6" height="2" fill="#7e838c" />
        </g>
        <path d="M282 152 l-3 4" stroke="#bfc3c9" strokeWidth="1" />
      </g>

      <circle cx={PIVOT.x} cy={PIVOT.y} r="20" fill="url(#arm-base)" stroke="rgba(255,255,255,0.1)" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="8" fill="#9aa0a8" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="3" fill="#2a2d33" />
    </svg>
  );
}

export function RecordCrate({ accent }: { interest: Interest; accent: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [down, setDown] = useState(false);
  const [speed, setSpeed] = useState<Speed>(33);
  const recordRef = useRef<HTMLDivElement>(null);
  const strobeRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const spin = useRef({ angle: 0, omega: 0 });
  const target = useRef(0);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    const t = timers.current;
    // Drop the needle once the view has opened.
    t.push(window.setTimeout(() => setDown(true), 1250));
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    target.current = down ? 360 / SECONDS_PER_REV[speed] : 0;
  }, [down, speed]);

  // Platter physics: it takes a moment to come up to speed and to spin down.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = spin.current;
      s.omega = target.current + (s.omega - target.current) * Math.exp(-dt * (target.current ? 2.6 : 1.8));
      s.angle = (s.angle + s.omega * dt) % 360;
      const t = `rotate(${s.angle}deg)`;
      if (recordRef.current) recordRef.current.style.transform = t;
      if (strobeRef.current) strobeRef.current.style.transform = t;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const choose = useCallback(
    (i: number) => {
      if (i === index) {
        setDown((d) => !d);
        return;
      }
      timers.current.splice(0).forEach((id) => window.clearTimeout(id));
      setDown(false);
      later(() => setIndex(i), reduce ? 0 : 650);
      later(() => setDown(true), reduce ? 0 : 1500);
    },
    [index, reduce],
  );

  const album = musicRotation[index];

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-14">
      {/* Turntable. */}
      <motion.div
        className="relative mx-auto aspect-[11/9] w-full max-w-[480px] rounded-[22px] border border-white/5 bg-[linear-gradient(145deg,#2b2d33,#151619_55%,#0d0e10)] shadow-[0_30px_70px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]"
        initial={reduce ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.5, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div aria-hidden className="absolute inset-0 rounded-[22px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.014)_0_1px,transparent_1px_3px)]" />

        {/* Platter, with strobe dots round the rim. */}
        <div aria-hidden className="absolute aspect-square rounded-full bg-[#0c0c0e] shadow-[0_8px_24px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.06)]" style={{ left: "4%", top: "7.55%", width: "70%" }}>
          <div
            ref={strobeRef}
            className="absolute inset-0 rounded-full"
            style={{
              background: "repeating-conic-gradient(rgba(220,225,235,0.55) 0 1.1deg, transparent 1.1deg 3.6deg)",
              WebkitMask: "radial-gradient(circle, transparent 0 94%, black 94.5% 98%, transparent 98.5%)",
              mask: "radial-gradient(circle, transparent 0 94%, black 94.5% 98%, transparent 98.5%)",
            }}
          />
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key={album.image}
            className="absolute aspect-square"
            style={{ left: "6%", top: "10%", width: "66%" }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: "38%", scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: "-10%", y: "-14%", scale: 1.04 }}
            transition={{ duration: 0.7, ease: [0.3, 0, 0.2, 1] }}
          >
            <div
              ref={recordRef}
              className="absolute inset-0 rounded-full shadow-[0_10px_28px_rgba(0,0,0,0.7),inset_0_0_0_2px_rgba(255,255,255,0.04)]"
              style={{ background: VINYL }}
            >
              <div className="absolute inset-[33%] overflow-hidden rounded-full shadow-[0_0_0_2px_rgba(0,0,0,0.5)]">
                <Image src={album.image} alt="" fill sizes="160px" className="object-cover" />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_55%,rgba(0,0,0,0.35))]" />
              </div>
            </div>
            {/* The light stays still while the record turns under it. */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full mix-blend-screen"
              style={{
                background:
                  "conic-gradient(from 35deg, transparent 0 7%, rgba(255,255,255,0.1) 11%, transparent 17% 52%, rgba(255,255,255,0.08) 61%, transparent 67%)",
              }}
            />
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[3%] w-[3%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f4f5f7,#80858d)]" />
          </motion.div>
        </AnimatePresence>

        <Tonearm down={down} reduce={reduce} />

        {/* Controls. */}
        <div className="absolute bottom-[4.5%] left-[5%] flex items-center gap-1.5">
          {([33, 45] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={`rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.1em] transition-colors duration-200 ${
                speed === s ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/45 hover:text-white/80"
              }`}
            >
              {s === 33 ? "33⅓" : "45"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDown((d) => !d)}
          aria-label={down ? "Lift the needle" : "Drop the needle"}
          className="absolute bottom-[4.5%] right-[5%] flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60 hover:text-white"
        >
          <span
            className="h-1.5 w-1.5 rounded-full transition-shadow duration-300"
            style={{ background: down ? accent : "#3a3d44", boxShadow: down ? `0 0 8px ${accent}` : "none" }}
          />
          {down ? "Lift" : "Play"}
        </button>
      </motion.div>

      {/* Now spinning, and the crate. */}
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{down ? "Now spinning" : "Cued up"}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={album.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="mt-2 text-2xl font-light leading-tight text-white sm:text-3xl">{album.title}</p>
            <p className="mt-1 font-serif text-lg italic text-white/60">{album.subtitle}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex h-6 items-end gap-[3px]" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className="eq-bar w-[3px] origin-bottom rounded-full"
              style={{
                height: "100%",
                background: accent,
                opacity: 0.75,
                animationDuration: `${0.45 + ((i * 37) % 23) / 30}s`,
                animationDelay: `${-((i * 53) % 17) / 20}s`,
                animationName: down ? undefined : "none",
                transform: down ? undefined : "scaleY(0.12)",
                transition: "transform 0.4s ease-out",
              }}
            />
          ))}
        </div>

        <p className="mt-9 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">The crate · pick one</p>
        <ul className="-mx-5 mt-4 flex snap-x gap-4 overflow-x-auto px-5 pb-4 pt-6 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {musicRotation.map((m, i) => {
            const selected = i === index;
            return (
              <li key={m.title} className="w-[34vw] shrink-0 snap-start sm:w-auto">
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${m.title} by ${m.subtitle}`}
                  onClick={() => choose(i)}
                  className="group block w-full text-left [perspective:700px] focus-visible:outline-none"
                >
                  <span className="relative block aspect-square">
                    {/* The record peeks out of its sleeve on hover. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-[7%] top-0 aspect-square rounded-full transition-transform duration-500 ease-out group-hover:-translate-y-[20%] group-focus-visible:-translate-y-[20%]"
                      style={{ background: VINYL, opacity: selected ? 0 : 1 }}
                    />
                    <span
                      className={`absolute inset-0 overflow-hidden rounded-[3px] shadow-[0_14px_28px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-out [transform-origin:50%_100%] ${
                        selected
                          ? "[transform:rotateX(0deg)_translateY(-6px)]"
                          : "[transform:rotateX(14deg)] group-hover:[transform:rotateX(0deg)_translateY(-3px)]"
                      }`}
                      style={selected ? { boxShadow: `0 0 0 1.5px ${accent}, 0 18px 34px rgba(0,0,0,0.6)` } : undefined}
                    >
                      <Image src={m.image} alt="" fill sizes="(max-width: 640px) 34vw, 180px" className="object-cover" />
                      <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.14),transparent_35%,transparent_70%,rgba(0,0,0,0.25))]" />
                    </span>
                  </span>
                  <span className="mt-2.5 block truncate text-xs font-medium text-white/85">{m.title}</span>
                  <span className="block truncate text-[11px] text-white/45">
                    {selected ? <span style={{ color: accent }}>on the platter · </span> : null}
                    {m.subtitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
