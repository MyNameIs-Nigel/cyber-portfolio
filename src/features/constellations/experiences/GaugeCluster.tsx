"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import type { Interest } from "@/types";

/*
 * Cars opens onto an instrument cluster. It does the bulb check and needle
 * sweep on start, idles with a little wobble, and revs while you hold the
 * button — draining a second gauge, the wallet, which only payday refills.
 */

const SWEEP_START = -130;
const SWEEP = 260;
const REDLINE = 6500;
const MAX_RPM = 8000;
const LIMITER = 7050;
const IDLE = 820;
const SHIFT_LIGHTS = 10;
const LED_COLORS = ["#22c55e", "#22c55e", "#22c55e", "#22c55e", "#f59e0b", "#f59e0b", "#f59e0b", "#ef4444", "#ef4444", "#ef4444"];

type Message = "check" | "ready" | "revving" | "limiter" | "low" | "empty" | "payday";

const MESSAGES: Record<Message, string> = {
  check: "System check",
  ready: "Ready · hold to rev",
  revving: "Pushing it",
  limiter: "Rev limiter",
  low: "Low wallet · refill soon",
  empty: "P0420 · wallet efficiency below threshold",
  payday: "Payday · refuelling",
};

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function arc(r: number, from: number, to: number): string {
  const [x0, y0] = polar(r, from);
  const [x1, y1] = polar(r, to);
  return `M${x0} ${y0} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

const at = (v: number) => SWEEP_START + SWEEP * v;

function Dial({
  kind,
  needleRef,
  accent,
}: {
  kind: "tach" | "wallet";
  needleRef: RefObject<SVGGElement | null>;
  accent: string;
}) {
  const tach = kind === "tach";
  const majors = tach
    ? Array.from({ length: 9 }, (_, i) => ({ v: i / 8, label: String(i) }))
    : [
        { v: 0, label: "E" },
        { v: 0.5, label: "½" },
        { v: 1, label: "F" },
      ];
  const minors = tach ? Array.from({ length: 33 }, (_, i) => i / 32) : Array.from({ length: 9 }, (_, i) => i / 8);
  const red = tach ? [REDLINE / MAX_RPM, 1] : [0, 0.125];
  const id = `dial-${kind}`;

  return (
    <svg viewBox="-180 -180 360 360" className="h-auto w-full" role="img" aria-label={tach ? "Tachometer" : "Wallet gauge"}>
      <defs>
        <radialGradient id={`${id}-face`} cx="0" cy="-0.1" r="1">
          <stop offset="0" stopColor="#141821" />
          <stop offset="0.75" stopColor="#090b10" />
          <stop offset="1" stopColor="#050608" />
        </radialGradient>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9dde3" />
          <stop offset="0.3" stopColor="#5b616c" />
          <stop offset="0.6" stopColor="#1c1f25" />
          <stop offset="1" stopColor="#9097a2" />
        </linearGradient>
      </defs>
      <circle r="174" fill="none" stroke={`url(#${id}-bezel)`} strokeWidth="6" />
      <circle r="170" fill={`url(#${id}-face)`} />
      <circle r="164" fill="none" stroke={accent} strokeOpacity="0.28" strokeWidth="1.2" style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />

      <path d={arc(146, at(red[0]), at(red[1]))} fill="none" stroke="#ef4444" strokeWidth="9" strokeOpacity="0.85" />
      <g stroke="#e8e4dc">
        {minors.map((v) => {
          const [x0, y0] = polar(156, at(v));
          const [x1, y1] = polar(tach && (v * 32) % 4 !== 0 ? 147 : 142, at(v));
          return <line key={v} x1={x0} y1={y0} x2={x1} y2={y1} strokeWidth={tach && (v * 32) % 4 !== 0 ? 1.2 : 3} strokeOpacity="0.85" />;
        })}
      </g>
      {majors.map(({ v, label }) => {
        const [x, y] = polar(tach ? 116 : 112, at(v));
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={tach && v * MAX_RPM >= REDLINE ? "#ff6b57" : "#f4f1ea"}
            style={{ fontSize: tach ? 26 : 30, fontWeight: 500, filter: "drop-shadow(0 0 3px rgba(255,236,210,0.35))" }}
          >
            {label}
          </text>
        );
      })}
      <text y="62" textAnchor="middle" fill="rgba(244,241,234,0.5)" className="font-mono" style={{ fontSize: 11, letterSpacing: "0.18em" }}>
        {tach ? "1/MIN ×1000" : "WALLET"}
      </text>
      {!tach ? (
        <text y="92" textAnchor="middle" fill="rgba(244,241,234,0.75)" style={{ fontSize: 22 }}>
          $
        </text>
      ) : null}

      <g ref={needleRef} transform={`rotate(${SWEEP_START})`}>
        <path d="M-3.4 22 L-1.1 -152 L1.1 -152 L3.4 22 Z" fill="#ff4b2b" style={{ filter: "drop-shadow(0 0 6px rgba(255,75,43,0.85))" }} />
      </g>
      <circle r="15" fill="#14161b" stroke="#2c3038" strokeWidth="2" />
      <circle r="5" fill="#3a3f48" />
    </svg>
  );
}

export function GaugeCluster({ accent }: { interest: Interest; accent: string }) {
  const reduce = useReducedMotion();
  const tachRef = useRef<SVGGElement>(null);
  const walletRef = useRef<SVGGElement>(null);
  const rpmRef = useRef<HTMLSpanElement>(null);
  const ledRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const lampLowRef = useRef<HTMLSpanElement>(null);
  const lampEngineRef = useRef<HTMLSpanElement>(null);
  const holding = useRef(false);
  const refilling = useRef(false);
  const [message, setMessage] = useState<Message>("check");
  const [revving, setRevving] = useState(false);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const started = last;
    let rpm = 0;
    let wallet = 0.82;
    let bounce = 0;
    // When the limiter last cut in; it reads as "on the limiter" for a moment after, not frame by frame.
    let limitedAt = -Infinity;
    let shown: Message = "check";
    const sweepDelay = reduce ? 0 : 0.9;
    const sweepTime = reduce ? 0 : 1.5;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - started) / 1000;
      let displayWallet = wallet;
      let limiter = false;
      let bulbCheck = false;

      if (t < sweepDelay + sweepTime) {
        // Bulb check and needle sweep, like turning the key.
        const p = Math.max(0, (t - sweepDelay) / Math.max(0.001, sweepTime));
        const s = Math.sin(Math.PI * p);
        rpm = MAX_RPM * s;
        displayWallet = wallet + (1 - wallet) * s;
        bulbCheck = t > sweepDelay * 0.6;
      } else {
        const idle = IDLE + 22 * Math.sin(t * 7.3) + 12 * Math.sin(t * 13.1);
        if (holding.current) {
          rpm += (MAX_RPM - rpm) * (1 - Math.exp(-dt * 1.5)) + 650 * dt;
          bounce -= dt;
          if (rpm >= LIMITER) {
            limitedAt = t;
            if (bounce <= 0) {
              rpm = LIMITER - 260 - Math.random() * 260;
              bounce = 0.07;
            } else {
              rpm = Math.min(rpm, LIMITER);
            }
          }
        } else {
          rpm += (idle - rpm) * (1 - Math.exp(-dt * 3.4));
        }
        if (refilling.current) {
          wallet = Math.min(1, wallet + dt * 0.55);
          if (wallet >= 1) refilling.current = false;
        } else {
          wallet = Math.max(0, wallet - Math.max(0, (rpm - 1800) / 6200) * dt * 0.055);
        }
        displayWallet = wallet;
        limiter = holding.current && t - limitedAt < 0.3;
      }

      tachRef.current?.setAttribute("transform", `rotate(${at(Math.min(1, Math.max(0, rpm / MAX_RPM)))})`);
      walletRef.current?.setAttribute("transform", `rotate(${at(displayWallet)})`);
      if (rpmRef.current) rpmRef.current.textContent = String(Math.round(rpm / 10) * 10).padStart(4, "0");

      const flash = limiter && Math.floor(t * 12) % 2 === 0;
      ledRefs.current.forEach((led, i) => {
        if (!led) return;
        const lit = bulbCheck || rpm >= 4600 + i * 230;
        const color = flash ? accent : LED_COLORS[i];
        led.style.background = lit && !(limiter && !flash) ? color : "rgba(255,255,255,0.06)";
        led.style.boxShadow = lit && !(limiter && !flash) ? `0 0 10px ${color}` : "none";
      });
      const low = bulbCheck || wallet < 0.25;
      const empty = bulbCheck || wallet <= 0.02;
      if (lampLowRef.current) lampLowRef.current.style.opacity = low ? "1" : "0.12";
      if (lampEngineRef.current) lampEngineRef.current.style.opacity = empty ? "1" : "0.12";

      let next: Message;
      if (t < sweepDelay + sweepTime) next = "check";
      else if (refilling.current) next = "payday";
      else if (wallet <= 0.02) next = "empty";
      else if (limiter) next = "limiter";
      else if (wallet < 0.25) next = "low";
      else if (holding.current) next = "revving";
      else next = "ready";
      if (next !== shown) {
        shown = next;
        setMessage(next);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [accent, reduce]);

  const press = (on: boolean) => {
    holding.current = on;
    setRevving(on);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, on: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (on && e.repeat) return;
    press(on);
  };

  return (
    <div>
      <motion.div
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(120%_100%_at_50%_0%,#10131a,#06070a_70%)] px-4 py-8 shadow-[0_30px_70px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-10 sm:py-10"
        initial={reduce ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.5, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
        <div className="relative grid grid-cols-2 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_170px_minmax(0,1fr)] sm:gap-6">
          <div className="mx-auto w-full max-w-[340px]">
            <Dial kind="tach" needleRef={tachRef} accent={accent} />
          </div>

          <div className="order-last col-span-2 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#07090d] px-4 py-4 shadow-[inset_0_2px_14px_rgba(0,0,0,0.8)] sm:order-none sm:col-span-1">
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: SHIFT_LIGHTS }, (_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    ledRefs.current[i] = el;
                  }}
                  className="h-2 w-2 rounded-full bg-white/5"
                />
              ))}
            </div>
            <div className="flex items-end gap-4">
              <span className="text-5xl font-light leading-none" style={{ color: accent }}>
                N
              </span>
              <span className="flex flex-col items-end font-mono">
                <span ref={rpmRef} className="text-xl tabular-nums leading-none text-white/85">
                  0000
                </span>
                <span className="text-[9px] uppercase tracking-[0.24em] text-white/35">rpm</span>
              </span>
            </div>
            <div className="flex gap-3" aria-hidden>
              <span ref={lampLowRef} className="rounded border border-amber-400/70 px-1.5 font-mono text-[10px] text-amber-400 opacity-10 transition-opacity">
                $ LOW
              </span>
              <span ref={lampEngineRef} className="rounded border border-amber-400/70 px-1.5 font-mono text-[10px] text-amber-400 opacity-10 transition-opacity">
                CHECK
              </span>
            </div>
            <p role="status" className="min-h-[2.4em] text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-white/60">
              {MESSAGES[message]}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[340px]">
            <Dial kind="wallet" needleRef={walletRef} accent={accent} />
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
        <button
          type="button"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            press(true);
          }}
          onPointerUp={() => press(false)}
          onPointerCancel={() => press(false)}
          onLostPointerCapture={() => press(false)}
          onKeyDown={(e) => onKey(e, true)}
          onKeyUp={(e) => onKey(e, false)}
          onBlur={() => press(false)}
          onContextMenu={(e) => e.preventDefault()}
          aria-pressed={revving}
          className="group relative flex h-28 w-28 touch-none select-none flex-col items-center justify-center rounded-full border border-white/15 bg-[radial-gradient(circle_at_40%_30%,#2a2e36,#0d0f13_70%)] shadow-[0_14px_34px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span
            aria-hidden
            className="absolute inset-2 rounded-full border transition-all duration-200"
            style={{ borderColor: accent, opacity: revving ? 1 : 0.4, boxShadow: revving ? `0 0 22px ${accent}, inset 0 0 14px ${accent}` : "none" }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">Hold</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">to rev</span>
        </button>
        <button
          type="button"
          onClick={() => (refilling.current = true)}
          className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Payday ↺
        </button>
      </div>
    </div>
  );
}
