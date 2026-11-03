"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { photoShowcase } from "@/data/media";
import type { Interest } from "@/types";
import { useFinePointer } from "../useFinePointer";

/*
 * Photography opens onto a contact sheet on a light table. The frames arrive
 * as orange-masked negatives and develop into positives; a loupe follows the
 * mouse over them, and a grease-pencil circle marks the one you're looking at.
 */

interface Frame {
  image: string;
  stock: string;
  year: string;
  /** Edge-print frame number, the way a half-frame roll counts them. */
  number: string;
}

const FRAMES: Frame[] = photoShowcase.map((p, i) => {
  const [stock = "", year = ""] = (p.caption ?? "").split(" - ");
  const n = 11 + Math.floor(i / 2);
  return { image: p.image, stock: stock.toUpperCase(), year, number: i % 2 ? `${n}A` : String(n) };
});

const STRIPS = [FRAMES.slice(0, 3), FRAMES.slice(3, 6)];
const LOUPE = 168;
const LOUPE_ZOOM = 2.6;

/** Sprocket holes, as a tiny repeating rounded rectangle. */
const SPROCKETS =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='12'><rect x='6' y='2' width='10' height='8' rx='1.8' fill='%23f3e9d8'/></svg>\")";

/** A wobbly, slightly overshooting loop, like a china marker drawn in one go. */
const GREASE = "M50 4 C82 3 98 30 97 74 C96 120 78 147 48 146 C17 145 3 118 4 72 C5 30 22 6 56 8 C66 9 72 12 76 16";

function FrameView({
  frame,
  index,
  fine,
  reduce,
  onOpen,
}: {
  frame: Frame;
  index: number;
  fine: boolean;
  reduce: boolean | null;
  onOpen: () => void;
}) {
  const [loupe, setLoupe] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [marked, setMarked] = useState(false);

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!fine || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setLoupe({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  };

  const delay = reduce ? 0 : 1.1 + index * 0.28;

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={() => setMarked(true)}
      onPointerMove={onMove}
      onPointerLeave={() => {
        setLoupe(null);
        setMarked(false);
      }}
      onFocus={() => setMarked(true)}
      onBlur={() => setMarked(false)}
      aria-label={`Frame ${frame.number}: ${frame.stock.toLowerCase()}, ${frame.year}. Open larger.`}
      className={`group relative aspect-[2/3] w-full focus-visible:outline-none ${fine ? "cursor-none" : ""}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[2px] bg-black">
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { filter: "invert(1) brightness(0.85) contrast(0.9)" }}
          animate={{ filter: "invert(0) brightness(1) contrast(1)", transitionEnd: { filter: "none" } }}
          transition={{ delay, duration: 1.9, ease: [0.4, 0, 0.2, 1] }}
        >
          <Image src={frame.image} alt="" fill sizes="(max-width: 640px) 30vw, 220px" className="object-cover" />
        </motion.div>
        {/* The orange mask of colour negative film, clearing as the print develops. */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[#c2662a] mix-blend-multiply"
          initial={reduce ? false : { opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ delay, duration: 1.6, ease: "easeOut" }}
        />
        <div className="absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,0.45)]" />
      </div>

      <svg
        aria-hidden
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-[9%] h-[118%] w-[118%] overflow-visible"
      >
        <motion.path
          d={GREASE}
          fill="none"
          stroke="#ff3b30"
          strokeWidth="2.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 1px rgba(255,59,48,0.6))" }}
          initial={false}
          animate={{ pathLength: marked ? 1 : 0, opacity: marked ? 0.9 : 0 }}
          transition={{ duration: marked ? 0.55 : 0.25, ease: "easeOut" }}
        />
      </svg>

      {loupe ? (
        <span
          aria-hidden
          className="pointer-events-none absolute z-20 overflow-hidden rounded-full border-2 border-white/80 bg-black shadow-[0_18px_40px_rgba(0,0,0,0.7),inset_0_0_24px_rgba(0,0,0,0.6)]"
          style={{ width: LOUPE, height: LOUPE, left: loupe.x - LOUPE / 2, top: loupe.y - LOUPE / 2 }}
        >
          <span
            className="absolute"
            style={{
              width: loupe.w * LOUPE_ZOOM,
              height: loupe.h * LOUPE_ZOOM,
              left: LOUPE / 2 - loupe.x * LOUPE_ZOOM,
              top: LOUPE / 2 - loupe.y * LOUPE_ZOOM,
            }}
          >
            <Image src={frame.image} alt="" fill sizes="720px" className="object-cover" />
          </span>
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_50%_32%_at_34%_22%,rgba(255,255,255,0.22),transparent_70%)]" />
        </span>
      ) : null}
    </button>
  );
}

function Enlargement({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (d: number) => void }) {
  const frame = FRAMES[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    // Capture phase, so Escape closes the print before it can close the whole view.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, onStep]);

  return (
    <motion.div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/90 p-4 backdrop-blur-sm sm:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={frame.image}
          className="relative h-[72vh] w-full max-w-[min(90vw,560px)]"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Image src={frame.image} alt={`Photograph on ${frame.stock.toLowerCase()}, ${frame.year}`} fill sizes="(max-width: 640px) 90vw, 560px" className="object-contain" />
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous frame" className="h-9 w-9 rounded-full border border-white/20 text-white/70 hover:border-white/50 hover:text-white">
          ←
        </button>
        <p className="min-w-[180px] text-center font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">
          {frame.number} · {frame.stock} · {frame.year}
        </p>
        <button type="button" onClick={() => onStep(1)} aria-label="Next frame" className="h-9 w-9 rounded-full border border-white/20 text-white/70 hover:border-white/50 hover:text-white">
          →
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="ml-2 rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:border-white/50 hover:text-white"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}

export function ContactSheet({ accent }: { interest: Interest; accent: string }) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + FRAMES.length) % FRAMES.length)), []);
  const closePrint = useCallback(() => setOpen(null), []);

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 px-3 py-8 sm:px-10 sm:py-12">
        {/* The light table: warm, diffuse, brightest in the middle. */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_45%,rgba(255,236,210,0.2),rgba(255,226,190,0.07)_55%,rgba(255,220,180,0.02)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.015)_0_1px,transparent_1px_4px)]" />

        <div className="relative mx-auto flex max-w-[760px] flex-col gap-8 sm:gap-10">
          {STRIPS.map((strip, si) => (
            <motion.div
              key={si}
              className="relative rounded-[3px] bg-[#0d0a08] px-2 shadow-[0_14px_40px_rgba(0,0,0,0.55)] sm:px-4"
              initial={reduce ? false : { opacity: 0, x: si ? 120 : -120, rotate: 0 }}
              animate={{ opacity: 1, x: 0, rotate: si ? 0.8 : -1.1 }}
              transition={{ delay: reduce ? 0 : 0.55 + si * 0.18, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div aria-hidden className="h-4 sm:h-5" style={{ backgroundImage: SPROCKETS, backgroundRepeat: "repeat-x", backgroundPosition: "center", backgroundSize: "auto 70%" }} />
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {strip.map((frame, fi) => (
                  <FrameView
                    key={frame.image}
                    frame={frame}
                    index={si * 3 + fi}
                    fine={fine}
                    reduce={reduce}
                    onOpen={() => setOpen(si * 3 + fi)}
                  />
                ))}
              </div>
              {/* Edge print. */}
              <div aria-hidden className="grid grid-cols-3 gap-2 pt-1 font-mono text-[7px] tracking-[0.18em] text-[#e9a23b]/75 sm:gap-3 sm:text-[9px]">
                {strip.map((frame) => (
                  <span key={frame.image} className="flex justify-between gap-1 truncate">
                    <span>▸{frame.number}</span>
                    <span className="truncate">{frame.stock}</span>
                  </span>
                ))}
              </div>
              <div aria-hidden className="h-4 sm:h-5" style={{ backgroundImage: SPROCKETS, backgroundRepeat: "repeat-x", backgroundPosition: "center", backgroundSize: "auto 70%" }} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {fine ? "Hover a frame for the loupe; click for a print." : "Tap a frame for a print."} Full-size photos live on{" "}
          <a href="https://www.ndsironwood.com/" target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white" style={{ textDecorationColor: accent }}>
            ndsironwood.com
          </a>
          .
        </p>
        <Link href="/projects/ndsironwood" className="font-mono text-[11px] uppercase tracking-[0.2em] hover:text-white" style={{ color: accent }}>
          How I built that site →
        </Link>
      </div>

      <AnimatePresence>{open !== null ? <Enlargement index={open} onClose={closePrint} onStep={step} /> : null}</AnimatePresence>
    </div>
  );
}
