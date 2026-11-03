import { createGlow, createSprite, TAU } from "@/features/ambient/scenes/sceneUtils";
import { DEPTH, STAR_DENSITY } from "./constellations.constants";
import type { PlacedConstellation, View } from "./constellations.types";

/*
 * The sky behind the constellations: three parallax layers of field stars and a
 * pre-rendered Milky Way. Everything is generated from a seed so the sky is the
 * same on every visit, and drawn through a `View` so the same code paints both
 * the page and the magnified circle inside the spyglass.
 */

/** Small, fast, seedable PRNG (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  const u = Math.max(1e-9, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * random());
}

/** Star colours by temperature, hot blue-white through to cool orange. Mostly white, as the eye sees them. */
const TINTS = ["#cfe0ff", "#ffffff", "#ffffff", "#ffffff", "#fff1dc", "#ffd8b4", "#ffc2a6"];

interface FieldStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkle: number;
  freq: number;
  phase: number;
  tint: number;
}

interface StarLayer {
  depth: number;
  /** Sorted by y, so a frame only walks the visible band. */
  stars: FieldStar[];
}

interface Coverage {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface SkyField {
  layers: StarLayer[];
  milkyWay: { canvas: HTMLCanvasElement; cover: Coverage } | null;
  glows: Array<HTMLCanvasElement | null>;
  spike: HTMLCanvasElement | null;
}

/**
 * The part of a layer any camera move can reveal: the full scroll (scaled by
 * depth), plus enough to the sides for the zoom to swing toward a constellation.
 */
function coverage(depth: number, width: number, height: number, worldHeight: number): Coverage {
  const pan = Math.max(0, worldHeight - height);
  const mx = (0.34 * depth + 0.12) * width;
  return { x0: -mx, x1: width + mx, y0: -0.18 * height, y1: height * 1.18 + pan * depth };
}

function makeLayer(random: () => number, depth: number, density: number, cover: Coverage, near: boolean): StarLayer {
  const area = (cover.x1 - cover.x0) * (cover.y1 - cover.y0);
  const count = Math.round((area / 1_000_000) * density);
  const stars: FieldStar[] = [];
  for (let i = 0; i < count; i++) {
    // Heavily skewed: thousands of faint points, a few bright ones.
    const size = near ? 0.7 + 1.5 * random() ** 3 : 0.32 + 1.15 * random() ** 4;
    stars.push({
      x: cover.x0 + random() * (cover.x1 - cover.x0),
      y: cover.y0 + random() * (cover.y1 - cover.y0),
      size,
      alpha: Math.min(1, 0.22 + size * 0.42 + random() * 0.2),
      // Faint stars scintillate more; bright ones mostly hold steady.
      twinkle: 0.12 + 0.4 * random() * (1 - Math.min(1, size / 2)),
      freq: 0.25 + random() * 1.4,
      phase: random() * TAU,
      tint: Math.floor(random() * TINTS.length),
    });
  }
  stars.sort((a, b) => a.y - b.y);
  return { depth, stars };
}

const MILKY_WAY_RES = 0.5;

/** A dusty band of unresolved stars with dark lanes through it, painted once. */
function paintMilkyWay(random: () => number, cover: Coverage, width: number): HTMLCanvasElement | null {
  const w = (cover.x1 - cover.x0) * MILKY_WAY_RES;
  const h = (cover.y1 - cover.y0) * MILKY_WAY_RES;
  const sprite = createSprite(w, h, 1);
  if (!sprite) return null;
  const { ctx } = sprite;
  ctx.scale(MILKY_WAY_RES, MILKY_WAY_RES);
  ctx.translate(-cover.x0, -cover.y0);

  // The band runs from the top right of the sky to the bottom left, meandering.
  const ax = width * 1.1;
  const ay = cover.y0;
  const bx = -width * 0.12;
  const by = cover.y1;
  const len = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / len;
  const ny = (bx - ax) / len;
  const along = (t: number, offset: number) => {
    const wander = Math.sin(t * Math.PI * 1.7 + 0.5) * width * 0.08;
    return [ax + (bx - ax) * t + nx * (wander + offset), ay + (by - ay) * t + ny * (wander + offset)] as const;
  };
  const bandWidth = (t: number) => width * 0.16 * (0.75 + 0.45 * Math.sin(t * Math.PI * 2.4 + 1.1) ** 2);

  // Broad glow: blues and violets with a warmer core.
  const palette = ["70,96,170", "98,72,168", "52,120,150", "150,100,150", "170,120,90"];
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 260; i++) {
    const t = random();
    const bw = bandWidth(t);
    const [x, y] = along(t, gaussian(random) * bw * 0.32);
    const r = bw * (0.3 + 0.85 * random());
    const warm = Math.abs(t - 0.5) < 0.18 && random() < 0.5;
    const color = warm ? palette[4] : palette[Math.floor(random() * 4)];
    const a = 0.012 + random() * 0.022;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${a})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Unresolved star clouds: too many, too faint to draw one by one every frame.
  // Many, faint and soft-edged, so together they read as texture in the glow
  // rather than as pixel noise once this half-resolution image is scaled up.
  const puff = createGlow(4, 1, [
    [0, "rgba(233,238,255,1)"],
    [0.5, "rgba(233,238,255,0.35)"],
    [1, "rgba(233,238,255,0)"],
  ]);
  const clouds = Math.round(14000 * (width / 1440) * ((cover.y1 - cover.y0) / 2000));
  for (let i = 0; puff && i < clouds; i++) {
    const t = random();
    const bw = bandWidth(t);
    const off = gaussian(random) * bw * 0.34;
    const [x, y] = along(t, off);
    ctx.globalAlpha = Math.max(0, (0.04 + random() * 0.2) * (1 - Math.abs(off) / (bw * 1.2)));
    const s = 3 + random() * 5;
    ctx.drawImage(puff, x - s / 2, y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;

  // Dark dust lanes, slightly off the band's spine, like the Great Rift.
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 170; i++) {
    const t = random();
    const bw = bandWidth(t);
    const [x, y] = along(t, bw * (0.08 + gaussian(random) * 0.12));
    const r = bw * (0.06 + 0.2 * random());
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.18 + random() * 0.3;
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // A few faint nebulae away from the band.
  ctx.globalCompositeOperation = "lighter";
  const nebulae = ["120,70,170", "40,130,150", "170,70,110"];
  for (let i = 0; i < 6; i++) {
    const x = cover.x0 + random() * (cover.x1 - cover.x0);
    const y = cover.y0 + random() * (cover.y1 - cover.y0);
    const r = width * (0.18 + random() * 0.3);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${nebulae[i % nebulae.length]},0.045)`);
    g.addColorStop(1, `rgba(${nebulae[i % nebulae.length]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = "source-over";
  return sprite.canvas;
}

export function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** A soft star with a four-point diffraction cross, for the brightest stars. */
function paintSpike(dpr: number): HTMLCanvasElement | null {
  const r = 30;
  const sprite = createSprite(r * 2, r * 2, dpr);
  if (!sprite) return null;
  const { ctx } = sprite;
  const core = ctx.createRadialGradient(r, r, 0, r, r, r * 0.4);
  core.addColorStop(0, "rgba(255,255,255,0.9)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, r * 2, r * 2);
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
  ]) {
    const g = ctx.createLinearGradient(r - dx * r, r - dy * r, r + dx * r, r + dy * r);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.75)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    if (dx) ctx.fillRect(0, r - 0.5, r * 2, 1);
    else ctx.fillRect(r - 0.5, 0, 1, r * 2);
  }
  return sprite.canvas;
}

export function createGlowSprite(hex: string, dpr: number): HTMLCanvasElement | null {
  const rgb = hexToRgb(hex);
  return createGlow(12, dpr, [
    [0, `rgba(${rgb},1)`],
    [0.12, `rgba(${rgb},0.85)`],
    [0.3, `rgba(${rgb},0.22)`],
    [1, `rgba(${rgb},0)`],
  ]);
}

export function createSkyField(
  random: () => number,
  width: number,
  height: number,
  worldHeight: number,
  dpr: number,
): SkyField {
  const cover = (d: number) => coverage(d, width, height, worldHeight);
  const mwCover = cover(DEPTH.milkyWay);
  const milkyWay = paintMilkyWay(random, mwCover, width);
  return {
    layers: [
      makeLayer(random, DEPTH.far, STAR_DENSITY.far, cover(DEPTH.far), false),
      makeLayer(random, DEPTH.mid, STAR_DENSITY.mid, cover(DEPTH.mid), false),
      makeLayer(random, DEPTH.near, STAR_DENSITY.near, cover(DEPTH.near), true),
    ],
    milkyWay: milkyWay ? { canvas: milkyWay, cover: mwCover } : null,
    glows: TINTS.map((t) => createGlowSprite(t, dpr)),
    spike: paintSpike(dpr),
  };
}

function firstVisible(stars: FieldStar[], y: number): number {
  let lo = 0;
  let hi = stars.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (stars[mid].y < y) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export interface FieldPaint {
  /** Width and height of the target, in its own CSS pixels. */
  width: number;
  height: number;
  time: number;
  /** Zoom speed in scale-per-second, for the warp streaks; 0 at rest. */
  warp: number;
  /** Where the warp streaks radiate from, in target pixels. */
  warpX: number;
  warpY: number;
  /** Overall brightness, so the lens can lift faint stars a little. */
  gain: number;
}

export function drawMilkyWay(ctx: CanvasRenderingContext2D, field: SkyField, view: View, dpr: number): void {
  const mw = field.milkyWay;
  if (!mw) return;
  const { cover } = mw;
  ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, dpr * view.tx, dpr * view.ty);
  ctx.drawImage(mw.canvas, cover.x0, cover.y0, cover.x1 - cover.x0, cover.y1 - cover.y0);
}

export function drawStarLayer(
  ctx: CanvasRenderingContext2D,
  field: SkyField,
  layer: StarLayer,
  view: View,
  dpr: number,
  paint: FieldPaint,
): void {
  const { stars } = layer;
  const pad = 24;
  const yTop = (-pad - view.ty) / view.scale;
  const yBottom = (paint.height + pad - view.ty) / view.scale;
  const sizeScale = Math.sqrt(view.scale);
  const streak = paint.warp * 0.11 * layer.depth;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#f4f6ff";
  if (streak > 0.004) {
    ctx.strokeStyle = "#e8eeff";
    ctx.lineCap = "round";
  }
  for (let i = firstVisible(stars, yTop); i < stars.length; i++) {
    const s = stars[i];
    if (s.y > yBottom) break;
    const x = s.x * view.scale + view.tx;
    if (x < -pad || x > paint.width + pad) continue;
    const y = s.y * view.scale + view.ty;
    const flicker = 1 - s.twinkle + s.twinkle * (0.5 + 0.5 * Math.sin(paint.time * s.freq * TAU + s.phase));
    const alpha = Math.min(1, s.alpha * flicker * paint.gain);
    const size = s.size * sizeScale;

    if (streak > 0.004 && size > 0.5) {
      ctx.globalAlpha = alpha * 0.7;
      ctx.lineWidth = Math.max(0.6, size * 0.9);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (x - paint.warpX) * streak, y - (y - paint.warpY) * streak);
      ctx.stroke();
      continue;
    }
    if (size < 0.8) {
      ctx.globalAlpha = alpha;
      const d = Math.max(0.6, size * 1.5);
      ctx.fillRect(x - d / 2, y - d / 2, d, d);
      continue;
    }
    const sprite = field.glows[s.tint];
    if (!sprite) continue;
    const r = size * 3.4;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
    if (size > 1.75 && field.spike) {
      const k = size * 6;
      ctx.globalAlpha = alpha * 0.45;
      ctx.drawImage(field.spike, x - k, y - k, k * 2, k * 2);
    }
  }
  ctx.globalAlpha = 1;
}

export interface ConstellationPaint {
  /** How lit up it is: proximity to the lens, or being the one in it. */
  hot: number;
  /** Line-drawing progress, 0–1, drawn one segment after another. */
  drawn: number;
  /** "r,g,b" of the interest's accent. */
  rgb: string;
  glow: HTMLCanvasElement | null;
  time: number;
  /** Line weight multiplier; the lens draws a touch heavier. */
  weight: number;
}

const MAG_SIZE = [0, 3.1, 2.4, 1.85, 1.35];

function segment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  gap: number,
  progress: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < gap * 2.2) return;
  const ux = dx / len;
  const uy = dy / len;
  const sx = x0 + ux * gap;
  const sy = y0 + uy * gap;
  const run = (len - gap * 2) * progress;
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + ux * run, sy + uy * run);
}

export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  c: PlacedConstellation,
  view: View,
  dpr: number,
  field: SkyField,
  paint: ConstellationPaint,
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = Math.sqrt(view.scale);
  const pts = c.stars.map((s) => [s.x * view.scale + view.tx, s.y * view.scale + view.ty] as const);
  // Star charts leave a gap where a line meets its star.
  const gap = 7 * k;
  const segments = c.lines.length + c.rings.length;
  const lineRgb = paint.rgb;

  // Always-there ghost of the figure, so the sky hints at what's hiding in it.
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(${lineRgb},0.17)`;
  ctx.lineWidth = 0.9 * k * paint.weight;
  ctx.beginPath();
  for (const [a, b] of c.lines) segment(ctx, pts[a][0], pts[a][1], pts[b][0], pts[b][1], gap, 1);
  ctx.stroke();

  if (paint.drawn > 0.001) {
    const alpha = 0.18 + 0.55 * paint.hot;
    const passes: Array<[number, number]> = [
      [3.6 * k * paint.weight, alpha * 0.16],
      [1.1 * k * paint.weight, alpha],
    ];
    for (const [width, a] of passes) {
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(${lineRgb},${a})`;
      ctx.beginPath();
      c.lines.forEach(([ia, ib], i) => {
        const p = Math.min(1, Math.max(0, paint.drawn * segments - i));
        if (p > 0) segment(ctx, pts[ia][0], pts[ia][1], pts[ib][0], pts[ib][1], gap, p);
      });
      ctx.stroke();
      c.rings.forEach((ring, j) => {
        const p = Math.min(1, Math.max(0, paint.drawn * segments - c.lines.length - j));
        if (p <= 0) return;
        const x = ring.x * view.scale + view.tx;
        const y = ring.y * view.scale + view.ty;
        ctx.beginPath();
        ctx.arc(x, y, ring.r * view.scale, -Math.PI / 2, -Math.PI / 2 + TAU * p);
        ctx.stroke();
      });
    }
  } else {
    ctx.beginPath();
    for (const ring of c.rings) {
      const x = ring.x * view.scale + view.tx;
      const y = ring.y * view.scale + view.ty;
      ctx.moveTo(x + ring.r * view.scale, y);
      ctx.arc(x, y, ring.r * view.scale, 0, TAU);
    }
    ctx.stroke();
  }

  const white = field.glows[1];
  c.stars.forEach((s, i) => {
    const [x, y] = pts[i];
    const shimmer = 0.92 + 0.08 * Math.sin(paint.time * (0.7 + i * 0.13) * TAU + i);
    const size = MAG_SIZE[s.mag] * k * (1 + 0.18 * paint.hot);
    const alpha = Math.min(1, (0.85 + 0.15 * paint.hot) * shimmer);
    if (paint.glow) {
      const r = size * (6.5 + 3 * paint.hot);
      ctx.globalAlpha = (0.38 + 0.42 * paint.hot) * shimmer;
      ctx.drawImage(paint.glow, x - r, y - r, r * 2, r * 2);
    }
    if (white) {
      const r = size * 3.2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(white, x - r, y - r, r * 2, r * 2);
    }
    if (s.mag === 1 && field.spike) {
      const r = size * 7;
      ctx.globalAlpha = alpha * (0.45 + 0.35 * paint.hot);
      ctx.drawImage(field.spike, x - r, y - r, r * 2, r * 2);
    }
  });
  ctx.globalAlpha = 1;
}

