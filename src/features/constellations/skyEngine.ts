import type { Accent, InterestId } from "@/types";
import {
  AUTO_FOCUS_MS,
  DEPTH,
  FOCUS_RELEASE_MS,
  HOLD_TO_FOCUS_MS,
  LENS,
  LENS_DESIGN_PX,
  MAX_DPR,
  PIXEL_BUDGET,
  SKY_SEED,
  VIEWFINDER,
  ZOOM,
} from "./constellations.constants";
import type { Camera, LensMode, PlacedConstellation, SkyLayout, View } from "./constellations.types";
import { layoutSky } from "./figures";
import { focusDistance, opticsFor } from "./optics";
import {
  createGlowSprite,
  createSkyField,
  drawConstellation,
  drawMilkyWay,
  drawStarLayer,
  hexToRgb,
  seeded,
  type SkyField,
} from "./skyField";
import { approach, cssTransform, easeInOutCubic, layerView, magnify, project, smoothstep, unproject } from "./view";

/*
 * The sky is one imperative loop rather than React state: scroll, pointer,
 * focus and zoom all change every frame, and the page only needs to hear about
 * the few discrete moments — a constellation coming under the lens, and one
 * locking in.
 */

export interface LensElements {
  root: HTMLElement;
  background: HTMLCanvasElement;
  foreground: HTMLCanvasElement;
  /** Wraps the foreground canvas and the text details; carries the defocus filter. */
  optics: HTMLElement;
  details: HTMLElement | null;
  ring: SVGGElement | null;
  progress: SVGCircleElement | null;
  /** Status pill under the lens, outside the scaled root so its text stays legible. */
  readout: HTMLElement | null;
  readoutText: HTMLElement | null;
}

export interface SkyElements {
  section: HTMLElement;
  viewport: HTMLElement;
  canvas: HTMLCanvasElement;
  world: HTMLElement;
  spotlight: HTMLElement | null;
  lens: LensElements;
  hud: {
    ra: HTMLElement | null;
    dec: HTMLElement | null;
    mag: HTMLElement | null;
    cursor: HTMLElement | null;
  };
  labels: Map<InterestId, HTMLElement>;
}

export interface SkyCallbacks {
  onLayout(layout: SkyLayout): void;
  /** A constellation came under the lens (or left it). */
  onEngage(id: InterestId | null): void;
  /** Focus completed. `origin` is the constellation's position in client coordinates. */
  onLock(id: InterestId, origin: { x: number; y: number }): void;
}

interface Paint {
  hot: number;
  drawn: number;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  len: number;
}

interface ZoomTween {
  from: number;
  to: number;
  start: number;
  duration: number;
}

const DIAL_SMOOTHING = 18;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * 207;

function readAccent(n: Accent): string {
  const fallback = { 1: "#22c55e", 2: "#f97316", 3: "#8b5cf6", 4: "#38bdf8" }[n];
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--color-accent-${n}`).trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/** Mixes an accent toward white so constellation lines read as starlight with a tint, not as UI. */
function starlight(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex).split(",").map(Number);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `${mix(r)},${mix(g)},${mix(b)}`;
}

export class SkyEngine {
  private readonly els: SkyElements;
  private readonly cb: SkyCallbacks;
  private readonly ids: InterestId[];
  private readonly accents: Map<InterestId, { rgb: string; hex: string; glow: HTMLCanvasElement | null }>;
  private mode: LensMode;
  private reducedMotion = false;

  private layout: SkyLayout | null = null;
  private field: SkyField | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private bgCtx: CanvasRenderingContext2D | null = null;
  private fgCtx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private lensDpr = 1;
  private width = 0;
  private height = 0;

  private camOy = 0;
  private trackX = 0;
  private cam: Camera = { cx: 0, cy: 0, zoom: 1 };
  private prevZoom = 1;
  private zoomU = 0;
  private zoomTween: ZoomTween | null = null;
  private zoomId: InterestId | null = null;

  private pointer = { x: 0, y: 0, inside: false, down: false };
  /** The mouse is over something that wants a normal cursor (text, the chart). */
  private pointerBlocked = false;
  /** Set when the keyboard, not the mouse, is pointing the spyglass. */
  private keyboardTarget: InterestId | null = null;
  private snapLens = false;
  private lens = { x: 0, y: 0, d: LENS.roam as number, mag: LENS.magnification as number, ax: 0, ay: 0, contentY: 0.5, vis: 0, engaged: 0 };
  private engagedId: InterestId | null = null;
  private focus = 0;
  private dialFocus = 0;
  private autoFocusId: InterestId | null = null;
  private lockedId: InterestId | null = null;
  private readoutLabel = "";
  private paints = new Map<InterestId, Paint>();

  private shooting: Shooting | null = null;
  private nextShooting = 4;
  private time = 0;
  private frame = 0;
  private raf = 0;
  private last = 0;
  private inView = false;
  private timers: number[] = [];
  private cleanup: Array<() => void> = [];
  private layoutTimer = 0;

  constructor(els: SkyElements, cb: SkyCallbacks, interests: ReadonlyArray<{ id: InterestId; accent: Accent }>, mode: LensMode) {
    this.els = els;
    this.cb = cb;
    this.mode = mode;
    this.ids = interests.map((i) => i.id);
    this.accents = new Map(interests.map((i) => [i.id, { hex: readAccent(i.accent), rgb: "", glow: null }]));
    for (const [, a] of this.accents) a.rgb = starlight(a.hex, 0.45);
    for (const id of this.ids) this.paints.set(id, { hot: 0, drawn: 0 });
  }

  start(): void {
    const { viewport, section, canvas, lens } = this.els;
    this.ctx = canvas.getContext("2d");
    this.bgCtx = lens.background.getContext("2d");
    this.fgCtx = lens.foreground.getContext("2d");
    if (!this.ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = motion.matches;
    const onMotion = () => (this.reducedMotion = motion.matches);
    motion.addEventListener("change", onMotion);
    this.cleanup.push(() => motion.removeEventListener("change", onMotion));

    this.relayout();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(this.layoutTimer);
      this.layoutTimer = window.setTimeout(() => this.relayout(), 120);
    });
    ro.observe(viewport);
    ro.observe(section);
    this.cleanup.push(() => ro.disconnect());

    const io = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
      if (this.inView) this.resume();
      else this.pause();
    });
    io.observe(section);
    this.cleanup.push(() => io.disconnect());

    const move = (e: PointerEvent) => {
      if (this.mode !== "spyglass" || e.pointerType === "touch") return;
      const rect = viewport.getBoundingClientRect();
      if (!this.pointer.inside) {
        this.lens.x = e.clientX - rect.left;
        this.lens.y = e.clientY - rect.top;
      }
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
      this.pointer.inside = true;
      this.keyboardTarget = null;
    };
    const down = (e: PointerEvent) => {
      if (this.mode !== "spyglass" || e.pointerType === "touch" || e.button !== 0) return;
      move(e);
      this.pointer.down = true;
      // No text selection or image drag while holding focus.
      e.preventDefault();
    };
    const up = () => (this.pointer.down = false);
    const leave = () => {
      this.pointer.inside = false;
      this.pointer.down = false;
    };
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("blur", up);
    viewport.addEventListener("pointerleave", leave);
    this.cleanup.push(() => {
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("blur", up);
      viewport.removeEventListener("pointerleave", leave);
    });
  }

  destroy(): void {
    this.pause();
    window.clearTimeout(this.layoutTimer);
    for (const t of this.timers) window.clearTimeout(t);
    for (const fn of this.cleanup) fn();
    this.cleanup = [];
  }

  setMode(mode: LensMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.pointer.inside = false;
    this.disengage();
    this.relayout();
  }

  setPointerBlocked(blocked: boolean): void {
    this.pointerBlocked = blocked;
    if (blocked) this.pointer.down = false;
  }

  /** The touch focus ring reports in here, 0–1. */
  setDialFocus(value: number): void {
    this.dialFocus = Math.min(1, Math.max(0, value));
  }

  /** Keyboard focus landed on a constellation's button: point the lens at it. */
  preview(id: InterestId | null): void {
    if (id && !this.keyboardTarget && this.lens.vis < 0.05) this.snapLens = true;
    this.keyboardTarget = id;
    if (!id) this.autoFocusId = null;
  }

  /** Enter or Space on a constellation: centre it and pull focus for the visitor. */
  focusFor(id: InterestId): void {
    if (this.lockedId) return;
    this.scrollToConstellation(id, this.reducedMotion ? "instant" : "smooth");
    this.preview(id);
    this.autoFocusId = id;
  }

  /** The detail view closed: zoom back out to the sky. */
  release(): void {
    if (!this.lockedId) return;
    this.tweenZoom(0, this.reducedMotion ? 0 : ZOOM.outMs);
    const done = window.setTimeout(
      () => {
        this.lockedId = null;
        this.zoomId = null;
        this.focus = 0;
        this.dialFocus = 0;
        this.autoFocusId = null;
        this.els.lens.root.dataset.locked = "false";
        this.disengage();
      },
      this.reducedMotion ? 0 : ZOOM.outMs,
    );
    this.timers.push(done);
  }

  scrollToConstellation(id: InterestId, behavior: ScrollBehavior = "smooth"): void {
    const c = this.constellation(id);
    if (!c || !this.layout) return;
    const top = this.els.section.getBoundingClientRect().top + window.scrollY;
    const anchor = this.mode === "viewfinder" ? VIEWFINDER.centerY : 0.5;
    const pan = this.layout.worldHeight - this.height;
    const y = Math.min(pan, Math.max(0, c.y - this.height * anchor));
    window.scrollTo({ top: top + y, behavior });
  }

  private constellation(id: InterestId | null): PlacedConstellation | undefined {
    return id ? this.layout?.constellations.find((c) => c.id === id) : undefined;
  }

  private relayout(): void {
    const { viewport, section, canvas, world, lens } = this.els;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const worldHeight = section.offsetHeight;
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    const device = window.devicePixelRatio || 1;
    this.dpr = Math.min(MAX_DPR, device, Math.sqrt(PIXEL_BUDGET / (width * height)));
    this.lensDpr = Math.min(MAX_DPR, device);
    canvas.width = Math.round(width * this.dpr);
    canvas.height = Math.round(height * this.dpr);
    const lensPx = Math.round(LENS_DESIGN_PX * this.lensDpr);
    for (const c of [lens.background, lens.foreground]) {
      c.width = lensPx;
      c.height = lensPx;
    }
    const spriteDpr = Math.max(this.dpr, this.lensDpr);
    this.field = createSkyField(seeded(SKY_SEED), width, height, worldHeight, spriteDpr);
    for (const [, a] of this.accents) a.glow = createGlowSprite(a.hex, spriteDpr);
    this.layout = layoutSky(this.ids, width, height, worldHeight, this.mode === "viewfinder");
    world.style.width = `${width}px`;
    world.style.height = `${worldHeight}px`;
    this.cb.onLayout(this.layout);
    if (!this.raf) this.render(performance.now(), 0);
  }

  private resume(): void {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      this.render(now, dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private pause(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tweenZoom(to: number, duration: number): void {
    this.zoomTween = { from: this.zoomU, to, start: performance.now(), duration };
  }

  private disengage(): void {
    if (this.engagedId) {
      this.engagedId = null;
      this.cb.onEngage(null);
    }
    this.focus = 0;
    this.dialFocus = 0;
  }

  private engage(id: InterestId): void {
    if (this.engagedId === id) return;
    this.engagedId = id;
    this.focus = 0;
    this.dialFocus = 0;
    if (this.autoFocusId && this.autoFocusId !== id) this.autoFocusId = null;
    this.cb.onEngage(id);
  }

  private lock(id: InterestId): void {
    const c = this.constellation(id);
    if (!c || this.lockedId) return;
    this.lockedId = id;
    this.zoomId = id;
    this.focus = 1;
    this.autoFocusId = null;
    this.pointer.down = false;
    this.els.lens.root.dataset.locked = "true";
    // A small click under the thumb when the focus ring lands on ∞.
    if (this.mode === "viewfinder") navigator.vibrate?.(14);

    const rect = this.els.viewport.getBoundingClientRect();
    const [sx, sy] = project(layerView(this.cam, 1, this.width, this.height), c.x, c.y);
    const origin = { x: rect.left + sx, y: rect.top + sy };
    const reduced = this.reducedMotion;
    this.timers.push(window.setTimeout(() => this.tweenZoom(1, reduced ? 0 : ZOOM.inMs), reduced ? 0 : 140));
    this.timers.push(window.setTimeout(() => this.cb.onLock(id, origin), reduced ? 0 : ZOOM.overlayDelayMs));
  }

  private render(now: number, dt: number): void {
    const layout = this.layout;
    const field = this.field;
    const ctx = this.ctx;
    if (!layout || !field || !ctx) return;
    const W = this.width;
    const H = this.height;
    if (!this.reducedMotion) this.time += dt;
    this.frame++;

    // Scroll → camera. The section is pinned, so the camera pans the world under it.
    const rect = this.els.section.getBoundingClientRect();
    const pan = Math.max(0, layout.worldHeight - H);
    const oyTarget = Math.min(pan, Math.max(0, -rect.top));
    this.camOy = this.reducedMotion || dt === 0 ? oyTarget : approach(this.camOy, oyTarget, 13, dt);

    // On touch screens the telescope drifts sideways to line the nearest constellation up with the viewfinder.
    let trackTarget = 0;
    if (this.mode === "viewfinder") {
      const reticle = H * VIEWFINDER.centerY;
      let best: PlacedConstellation | null = null;
      let bestDy = Infinity;
      for (const c of layout.constellations) {
        const dy = Math.abs(c.y - this.camOy - reticle);
        if (dy < bestDy) {
          bestDy = dy;
          best = c;
        }
      }
      if (best) trackTarget = (best.x - W / 2) * smoothstep(H * 0.46, H * 0.1, bestDy);
    }
    this.trackX = dt === 0 ? trackTarget : approach(this.trackX, trackTarget, 5, dt);

    if (this.zoomTween) {
      const t = this.zoomTween.duration <= 0 ? 1 : Math.min(1, (now - this.zoomTween.start) / this.zoomTween.duration);
      this.zoomU = this.zoomTween.from + (this.zoomTween.to - this.zoomTween.from) * easeInOutCubic(t);
      if (t >= 1) this.zoomTween = null;
    }
    const restCx = W / 2 + this.trackX;
    const restCy = this.camOy + H / 2;
    const target = this.constellation(this.zoomId);
    this.cam = {
      cx: target ? restCx + (target.x - restCx) * this.zoomU : restCx,
      cy: target ? restCy + (target.y - restCy) * this.zoomU : restCy,
      zoom: 1 + (ZOOM.scale - 1) * this.zoomU,
    };
    const warp = dt > 0 ? Math.abs(this.cam.zoom - this.prevZoom) / dt : 0;
    this.prevZoom = this.cam.zoom;

    const views = {
      milkyWay: layerView(this.cam, DEPTH.milkyWay, W, H),
      layers: field.layers.map((l) => layerView(this.cam, l.depth, W, H)),
      plane: layerView(this.cam, 1, W, H),
    };

    this.updateLens(dt, views.plane, rect);
    this.updatePaints(dt, views.plane);

    // Main sky.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawMilkyWay(ctx, field, views.milkyWay, this.dpr);
    const fieldPaint = { width: W, height: H, time: this.time, warp, warpX: W / 2, warpY: H / 2, gain: 1 };
    field.layers.forEach((layer, i) => drawStarLayer(ctx, field, layer, views.layers[i], this.dpr, fieldPaint));
    this.drawShooting(ctx, dt);
    for (const c of layout.constellations) {
      const paint = this.paints.get(c.id)!;
      const accent = this.accents.get(c.id)!;
      drawConstellation(ctx, c, views.plane, this.dpr, field, {
        hot: paint.hot,
        drawn: paint.drawn,
        rgb: accent.rgb,
        glow: accent.glow,
        time: this.time,
        weight: 1,
      });
    }

    if (this.lens.vis > 0.01) this.drawLens(views, warp);

    // DOM that rides on the constellation plane.
    this.els.world.style.transform = cssTransform(views.plane);
    for (const [id, el] of this.els.labels) {
      const hot = this.paints.get(id)?.hot ?? 0;
      const away = this.zoomId && this.zoomId !== id ? 1 - this.zoomU : 1;
      el.style.opacity = String((0.34 + 0.66 * hot) * away * (1 - this.zoomU));
    }
    if (this.frame % 3 === 0) this.updateHud(layout);
  }

  private updateLens(dt: number, plane: View, sectionRect: DOMRect): void {
    const layout = this.layout!;
    const W = this.width;
    const H = this.height;
    const lens = this.lens;
    const spyglass = this.mode === "spyglass";
    const locked = this.lockedId !== null;

    // Where the lens is.
    let targetX: number;
    let targetY: number;
    let visible: number;
    if (spyglass) {
      const kb = this.constellation(this.keyboardTarget);
      if (kb) {
        [targetX, targetY] = project(plane, kb.x, kb.y);
      } else {
        targetX = this.pointer.x;
        targetY = this.pointer.y;
      }
      visible = ((this.pointer.inside && !this.pointerBlocked) || kb) && !locked ? 1 : 0;
    } else {
      targetX = W / 2;
      targetY = H * VIEWFINDER.centerY;
      // Fade the viewfinder in as the sky pins, and out as it lets go.
      // It also waits until the intro has scrolled past, rather than sitting on top of it.
      const entering = smoothstep(H * 0.45, 0, sectionRect.top) * smoothstep(H * 0.02, H * 0.16, this.camOy);
      const leaving = smoothstep(H * 0.55, H, sectionRect.bottom);
      visible = locked ? 0 : Math.min(entering, leaving);
    }
    const follow = dt === 0 || this.snapLens ? 1 : 1 - Math.exp(-28 * dt);
    this.snapLens = false;
    lens.x += (targetX - lens.x) * follow;
    lens.y += (targetY - lens.y) * follow;
    lens.vis = dt === 0 ? visible : approach(lens.vis, visible, visible ? 14 : 9, dt);

    // Is a constellation under it?
    if (!locked) {
      if (spyglass) {
        const [wx, wy] = unproject(plane, lens.x, lens.y);
        const current = this.constellation(this.engagedId);
        const dist = (c: PlacedConstellation) => Math.hypot(wx - c.x, wy - c.y) / c.radius;
        if ((!this.pointer.inside || this.pointerBlocked) && !this.keyboardTarget) {
          if (current) this.disengage();
        } else if (current && dist(current) > 1.4) {
          this.disengage();
        } else if (!current) {
          const hit = layout.constellations.find((c) => dist(c) < 1);
          if (hit) this.engage(hit.id);
        }
      } else {
        const current = this.constellation(this.engagedId);
        const off = (c: PlacedConstellation) => {
          const [sx, sy] = project(plane, c.x, c.y);
          return { dx: Math.abs(sx - lens.x), dy: Math.abs(sy - lens.y) };
        };
        if (current) {
          const { dy } = off(current);
          if (dy > H * 0.15 || visible < 0.5) this.disengage();
        } else if (visible > 0.5) {
          const hit = layout.constellations.find((c) => {
            const { dx, dy } = off(c);
            return dy < H * 0.085 && dx < W * 0.3;
          });
          if (hit) this.engage(hit.id);
        }
      }
    }

    // Focus.
    const engagedC = this.constellation(this.engagedId);
    if (engagedC && !locked) {
      const step = (dt * 1000) / (this.autoFocusId === engagedC.id ? AUTO_FOCUS_MS : HOLD_TO_FOCUS_MS);
      if (this.autoFocusId === engagedC.id) this.focus += step;
      else if (spyglass) this.focus = this.pointer.down ? this.focus + step : this.focus - (dt * 1000) / FOCUS_RELEASE_MS;
      else this.focus = approach(this.focus, this.dialFocus, DIAL_SMOOTHING, dt);
      this.focus = Math.min(1, Math.max(0, this.focus));
      if (this.focus >= 0.999 || (!spyglass && this.dialFocus >= 1 && this.focus > 0.97)) this.lock(engagedC.id);
    } else if (!locked) {
      this.focus = Math.max(0, this.focus - (dt * 1000) / FOCUS_RELEASE_MS);
    }

    // Size, framing and magnification.
    const engagedTarget = engagedC ? 1 : 0;
    lens.engaged = dt === 0 ? engagedTarget : approach(lens.engaged, engagedTarget, 7, dt);
    const engagedD = spyglass ? LENS.engaged : Math.min(W - VIEWFINDER.sideMargin * 2, VIEWFINDER.engagedMax);
    const roamD = spyglass ? LENS.roam : VIEWFINDER.roam;
    lens.d = roamD + (engagedD - roamD) * easeInOutCubic(lens.engaged);
    let anchorX = lens.x;
    let anchorY = lens.y;
    let mag: number = LENS.magnification;
    if (engagedC) {
      const [sx, sy] = project(plane, engagedC.x, engagedC.y);
      anchorX = sx;
      anchorY = sy;
      // Frame the whole figure, but never show less than the sky itself: it is a spyglass.
      mag = Math.min(2.3, Math.max(1.1, (0.36 * lens.d) / (engagedC.radius * this.cam.zoom)));
    }
    // Glide onto the constellation when it engages, and back to the cursor when it lets go.
    const settle = dt === 0 ? 1 : 1 - Math.exp(-(engagedC ? 9 : 20) * dt);
    lens.ax += (anchorX - lens.ax) * settle;
    lens.ay += (anchorY - lens.ay) * settle;
    lens.mag = approach(lens.mag, mag, 7, dt || 1);
    lens.contentY = 0.5 - 0.09 * lens.engaged;

    // Paint the DOM side of the lens.
    const { root, optics, background, details, ring, progress, readout, readoutText } = this.els.lens;
    const L = LENS_DESIGN_PX;
    const k = lens.d / L;
    root.style.transform = `translate3d(${lens.x - L / 2}px, ${lens.y - L / 2}px, 0) scale(${k})`;
    root.style.opacity = String(lens.vis);
    const o = opticsFor(this.focus, lens.engaged);
    optics.style.filter = o.filter;
    optics.style.transform = `scale(${o.breathing})`;
    background.style.filter = o.backgroundFilter;
    if (details) details.style.opacity = String(lens.engaged ** 2);
    const eased = easeInOutCubic(this.focus);
    ring?.setAttribute("transform", `rotate(${-136 * eased} 210 210)`);
    if (progress) progress.style.strokeDashoffset = String(PROGRESS_CIRCUMFERENCE * (1 - this.focus));

    if (readout && readoutText) {
      const show = engagedC && !locked ? lens.vis * lens.engaged : 0;
      readout.style.opacity = String(show);
      readout.style.transform = `translate3d(${lens.x}px, ${lens.y + lens.d / 2 + 22}px, 0) translateX(-50%)`;
      let label = "";
      if (engagedC) {
        if (this.focus >= 0.995) label = "∞ · in focus";
        else if (this.focus > 0.015) label = `focusing · ${focusDistance(this.focus)}`;
        else if (this.keyboardTarget) label = "press enter to focus";
        else label = spyglass ? "press and hold to focus" : "turn the focus ring";
      }
      if (label !== this.readoutLabel) {
        this.readoutLabel = label;
        readoutText.textContent = label;
      }
    }

    const spot = this.els.spotlight;
    if (spot) {
      spot.style.opacity = String(lens.vis * (0.25 + 0.75 * lens.engaged) * (1 - this.zoomU));
      spot.style.transform = `translate3d(${lens.x}px, ${lens.y}px, 0) translate(-50%, -50%)`;
    }
  }

  private updatePaints(dt: number, plane: View): void {
    const H = this.height;
    const lens = this.lens;
    const [wx, wy] = unproject(plane, lens.x, lens.y);
    for (const c of this.layout!.constellations) {
      const p = this.paints.get(c.id)!;
      let hot: number;
      if (this.zoomId) hot = this.zoomId === c.id ? 1 : 0;
      else if (this.engagedId === c.id) hot = 1;
      else if (this.mode === "spyglass") hot = smoothstep(2.6, 1, Math.hypot(wx - c.x, wy - c.y) / c.radius) * lens.vis * 0.8;
      else hot = smoothstep(H * 0.4, H * 0.1, Math.abs(project(plane, c.x, c.y)[1] - lens.y)) * 0.85;
      p.hot = dt === 0 ? hot : approach(p.hot, hot, 6, dt);
      const drawing = p.hot > 0.18;
      p.drawn = Math.min(1, Math.max(0, p.drawn + (drawing ? 1.25 : -1.8) * dt));
      if (this.reducedMotion || dt === 0) p.drawn = drawing ? 1 : 0;
    }
  }

  private drawLens(views: { milkyWay: View; layers: View[]; plane: View }, warp: number): void {
    const field = this.field!;
    const bg = this.bgCtx;
    const fg = this.fgCtx;
    if (!bg || !fg) return;
    const L = LENS_DESIGN_PX;
    const lens = this.lens;
    const factor = lens.mag / (lens.d / L);
    const cy = L * lens.contentY;
    const lensView = (v: View) => magnify(v, lens.ax, lens.ay, factor, L / 2, cy);
    const dpr = this.lensDpr;

    bg.setTransform(1, 0, 0, 1, 0, 0);
    bg.clearRect(0, 0, bg.canvas.width, bg.canvas.height);
    drawMilkyWay(bg, field, lensView(views.milkyWay), dpr);
    const paint = { width: L, height: L, time: this.time, warp, warpX: L / 2, warpY: cy, gain: 1.15 };
    field.layers.forEach((layer, i) => drawStarLayer(bg, field, layer, lensView(views.layers[i]), dpr, paint));

    fg.setTransform(1, 0, 0, 1, 0, 0);
    fg.clearRect(0, 0, fg.canvas.width, fg.canvas.height);
    const plane = lensView(views.plane);
    for (const c of this.layout!.constellations) {
      const [sx, sy] = project(plane, c.x, c.y);
      const reach = c.radius * plane.scale * 1.3;
      if (sx < -reach || sx > L + reach || sy < -reach || sy > L + reach) continue;
      const p = this.paints.get(c.id)!;
      const accent = this.accents.get(c.id)!;
      const engaged = this.engagedId === c.id;
      drawConstellation(fg, c, plane, dpr, field, {
        hot: engaged ? 1 : p.hot,
        drawn: engaged ? Math.max(p.drawn, lens.engaged) : p.drawn,
        rgb: accent.rgb,
        glow: accent.glow,
        time: this.time,
        weight: 1.25,
      });
    }
  }

  private drawShooting(ctx: CanvasRenderingContext2D, dt: number): void {
    if (this.reducedMotion) return;
    const W = this.width;
    const H = this.height;
    if (!this.shooting) {
      this.nextShooting -= dt;
      if (this.nextShooting <= 0 && this.zoomU < 0.01) {
        const angle = (200 + Math.random() * 28) * (Math.PI / 180);
        const speed = 900 + Math.random() * 500;
        this.shooting = {
          x: W * (0.3 + Math.random() * 0.7),
          y: H * (0.04 + Math.random() * 0.4),
          vx: Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          age: 0,
          life: 0.55 + Math.random() * 0.45,
          len: 110 + Math.random() * 120,
        };
        this.nextShooting = 7 + Math.random() * 9;
      }
      return;
    }
    const s = this.shooting;
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.age >= s.life) {
      this.shooting = null;
      return;
    }
    const fade = Math.sin((s.age / s.life) * Math.PI);
    const speed = Math.hypot(s.vx, s.vy);
    const tx = s.x - (s.vx / speed) * s.len;
    const ty = s.y - (s.vy / speed) * s.len;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
    g.addColorStop(0, `rgba(255,255,255,${0.85 * fade})`);
    g.addColorStop(0.25, `rgba(200,220,255,${0.35 * fade})`);
    g.addColorStop(1, "rgba(200,220,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  private updateHud(layout: SkyLayout): void {
    const { ra, dec, mag, cursor } = this.els.hud;
    // Decorative coordinates that move like a real mount's readout as you pan.
    const hours = 4.4 + (this.cam.cx / this.width) * 2.8;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    const deg = 64 - (this.cam.cy / layout.worldHeight) * 78;
    const sign = deg < 0 ? "−" : "+";
    const ad = Math.abs(deg);
    const dd = Math.floor(ad);
    const dm = Math.floor((ad - dd) * 60);
    const pad = (n: number) => String(n).padStart(2, "0");
    if (ra) ra.textContent = `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
    if (dec) dec.textContent = `${sign}${pad(dd)}° ${pad(dm)}′`;
    const magnification = this.cam.zoom * (this.lens.vis > 0.5 ? this.lens.mag : 1);
    if (mag) mag.textContent = `×${magnification.toFixed(1)}`;
    if (cursor) cursor.style.top = `${Math.min(100, Math.max(0, (this.cam.cy / layout.worldHeight) * 100))}%`;
  }
}
