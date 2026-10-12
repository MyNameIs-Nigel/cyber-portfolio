import type { AmbientScene, SceneFactory, Span, Stage } from "../ambient.types";
import { between, clamp, inView, TAU } from "./sceneUtils";

/*
 * Halloween: a dark room with a gothic window in each gutter. Rain streaks past
 * the glass, beads run down it, and every so often lightning floods the panes and
 * throws the frame, a corner cobweb and the spider hanging from it into
 * silhouette. Strictly greyscale.
 */

/** Pointed-arch radius as a fraction of window width; 0.5 would be a round arch. */
const ARCH_RADIUS = 0.7;
/** Horizontal drift of a raindrop per pixel fallen — a light wind from the left. */
const SLANT = 0.14;

const RAIN_LAYERS = [
  { density: 1 / 1400, len: [5, 9], speed: [260, 360], alpha: 0.07, width: 0.6 },
  { density: 1 / 1500, len: [11, 18], speed: [420, 560], alpha: 0.11, width: 0.8 },
  { density: 1 / 2600, len: [18, 28], speed: [620, 780], alpha: 0.16, width: 1 },
] as const;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

/** A bead of water stuck to the glass that now and then lets go and runs. */
interface Bead {
  x: number;
  y: number;
  r: number;
  rest: number;
  vy: number;
  slide: number;
  trail: number;
}

type Segment = [number, number, number, number, number, number];

interface Web {
  spokes: Array<[number, number]>;
  threads: Segment[];
  /** Where the spider's line is tied on, in web coordinates. */
  tie: [number, number] | null;
}

interface Pane {
  frame: Rect;
  glass: Rect;
  /** y of the transom at the foot of the arch. */
  spring: number;
  bar: number;
  rain: Drop[][];
  beads: Bead[];
  web: Web;
  /** Corner the web is woven into, and whether it opens to the left. */
  corner: [number, number];
  mirrored: boolean;
}

interface Strike {
  start: number;
  /** [delay, peak, decay] — each flash jumps to `peak` and falls off exponentially. */
  flashes: Array<[number, number, number]>;
  pane: number;
  bolt: Array<Array<[number, number]>>;
}

function archPath(ctx: CanvasRenderingContext2D, { x, y, w, h }: Rect): void {
  const r = w * ARCH_RADIUS;
  const rise = Math.sqrt(r * r - (r - w / 2) ** 2);
  const spring = y + rise;
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, spring);
  ctx.arc(x + r, spring, r, Math.PI, Math.atan2(-rise, w / 2 - r));
  ctx.arc(x + w - r, spring, r, Math.atan2(-rise, r - w / 2), 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function archRise(w: number): number {
  const r = w * ARCH_RADIUS;
  return Math.sqrt(r * r - (r - w / 2) ** 2);
}

/** Recursive midpoint displacement: a straight line roughened into a bolt. */
function jag(
  random: () => number,
  from: [number, number],
  to: [number, number],
  depth: number,
  spread: number,
): Array<[number, number]> {
  let points: Array<[number, number]> = [from, to];
  for (let d = 0; d < depth; d++) {
    const next: Array<[number, number]> = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const off = (random() - 0.5) * spread;
      next.push([(ax + bx) / 2 + (-(by - ay) / len) * off, (ay + by) / 2 + ((bx - ax) / len) * off], [bx, by]);
    }
    points = next;
    spread *= 0.55;
  }
  return points;
}

function forkLightning(random: () => number, w: number, h: number): Array<Array<[number, number]>> {
  const sx = between(random, w * 0.2, w * 0.8);
  const ex = clamp(sx + between(random, -w * 0.5, w * 0.5), w * 0.08, w * 0.92);
  const main = jag(random, [sx, -6], [ex, between(random, h * 0.55, h * 0.95)], 5, w * 0.35);
  const bolt = [main];
  const branches = 1 + Math.floor(random() * 2);
  for (let b = 0; b < branches; b++) {
    const [bx, by] = main[Math.floor(between(random, 0.2, 0.6) * main.length)];
    const to: [number, number] = [bx + between(random, -w * 0.35, w * 0.35), by + between(random, h * 0.12, h * 0.3)];
    bolt.push(jag(random, [bx, by], to, 4, w * 0.2));
  }
  return bolt;
}

/** A corner web opening right and down from the origin; mirror it for a right-hand corner. */
function weave(random: () => number, size: number, withSpider: boolean): Web {
  const count = 6;
  const spokes: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const edge = i === 0 || i === count - 1;
    const angle = (i / (count - 1)) * (Math.PI / 2) + (edge ? 0 : between(random, -0.07, 0.07));
    const len = size * (edge ? 1 : between(random, 0.82, 1.02));
    spokes.push([Math.cos(angle) * len, Math.sin(angle) * len]);
  }

  const rings = 7;
  const threads: Segment[] = [];
  for (let k = 1; k <= rings; k++) {
    const f = Math.pow(k / (rings + 0.6), 1.08);
    for (let i = 0; i < count - 1; i++) {
      if (random() < 0.06) continue; // the odd broken strand
      const fa = f * between(random, 0.96, 1.04);
      const fb = f * between(random, 0.96, 1.04);
      const [ax, ay] = [spokes[i][0] * fa, spokes[i][1] * fa];
      const [bx, by] = [spokes[i + 1][0] * fb, spokes[i + 1][1] * fb];
      // Spiral threads bow in toward the hub, which is what makes a web read as a web.
      const pull = 1 - between(random, 0.15, 0.22);
      threads.push([ax, ay, ((ax + bx) / 2) * pull, ((ay + by) / 2) * pull, bx, by]);
    }
  }

  // One snapped strand drooping off the outer edge.
  const [lx, ly] = spokes[1];
  threads.push([lx * 0.9, ly * 0.9, lx * 1.05, ly + size * 0.25, lx * 0.98, ly + size * 0.42]);

  const [tx, ty] = spokes[Math.floor(count / 2)];
  return { spokes, threads, tie: withSpider ? [tx * 0.72, ty * 0.72] : null };
}

export const createStormScene: SceneFactory = (random) => {
  let stage: Stage | null = null;
  let panes: Pane[] = [];
  let clock = 0;
  let nextStrike = between(random, 3.5, 7);
  let strike: Strike | null = null;

  const spawnDrop = (glass: Rect, layer: (typeof RAIN_LAYERS)[number], anywhere: boolean): Drop => {
    const len = between(random, layer.len[0], layer.len[1]);
    return {
      x: between(random, -glass.h * SLANT, glass.w),
      y: anywhere ? between(random, -len, glass.h) : between(random, -len - 60, -len),
      len,
      speed: between(random, layer.speed[0], layer.speed[1]),
    };
  };

  const spawnBead = (glass: Rect, anywhere: boolean): Bead => ({
    x: between(random, 2, glass.w - 2),
    y: anywhere ? between(random, glass.h * 0.15, glass.h - 4) : between(random, glass.h * 0.05, glass.h * 0.45),
    r: between(random, 0.7, 1.7),
    rest: between(random, 1, 12),
    vy: 0,
    slide: 0,
    trail: 0,
  });

  const layoutPane = (span: Span, index: number): Pane | null => {
    if (!stage) return null;
    const avail = span.x1 - span.x0;
    const w = clamp(avail * 0.6, 92, 200);
    const h = Math.min(w * 2.35, stage.height - 190);
    if (h < w * 1.4) return null;

    const frame: Rect = { x: span.x0 + (avail - w) / 2, y: Math.max(92, (stage.height - h) * 0.42), w, h };
    const ft = clamp(w * 0.05, 5, 9);
    const glass: Rect = { x: frame.x + ft, y: frame.y + ft * 1.25, w: w - ft * 2, h: h - ft * 2.25 };
    const spring = glass.y + archRise(glass.w);
    const bar = Math.max(2, ft * 0.55);

    // The left window gets the big web and its spider; the right one a small, older web.
    const mirrored = index === 1;
    const light = glass.w / 2 - bar / 2;
    const web = weave(random, light * (mirrored ? 0.5 : 0.82), !mirrored);
    const corner: [number, number] = [mirrored ? glass.x + glass.w : glass.x, spring + bar / 2];

    return {
      frame,
      glass,
      spring,
      bar,
      rain: RAIN_LAYERS.map((layer) =>
        Array.from({ length: Math.round(glass.w * glass.h * layer.density) }, () => spawnDrop(glass, layer, true)),
      ),
      beads: Array.from({ length: Math.round((glass.w * glass.h) / 4500) }, () => spawnBead(glass, true)),
      web,
      corner,
      mirrored,
    };
  };

  const startStrike = () => {
    const near = random() < 0.65;
    const jitter = () => between(random, 0.85, 1.15);
    const pane = Math.floor(random() * panes.length);
    strike = {
      start: clock,
      flashes: near
        ? [
            [0, 1, 0.07 * jitter()],
            [0.13 * jitter(), 0.75, 0.1 * jitter()],
            [0.3 * jitter(), 0.5, 0.45 * jitter()],
          ]
        : [
            [0, 0.42, 0.25 * jitter()],
            [0.22 * jitter(), 0.28, 0.4 * jitter()],
          ],
      pane: near ? pane : -1,
      bolt: near && panes[pane] ? forkLightning(random, panes[pane].glass.w, panes[pane].glass.h) : [],
    };
    nextStrike = clock + between(random, 9, 22);
  };

  const flashLevel = (): number => {
    if (!strike) return 0;
    const t = clock - strike.start;
    let level = 0;
    for (const [at, peak, decay] of strike.flashes) {
      if (t >= at) level = Math.max(level, peak * Math.exp(-(t - at) / decay));
    }
    return level;
  };

  const step = (pane: Pane, dt: number) => {
    const { glass } = pane;
    pane.rain.forEach((drops, li) => {
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.speed * dt;
        d.x += d.speed * SLANT * dt;
        if (d.y - d.len > glass.h) drops[i] = spawnDrop(glass, RAIN_LAYERS[li], false);
      }
    });
    for (let i = 0; i < pane.beads.length; i++) {
      const b = pane.beads[i];
      if (b.slide > 0) {
        const step = b.vy * dt;
        b.y += step;
        b.x += Math.sin(clock * 3 + b.r * 10) * 4 * dt;
        b.slide -= step;
        b.trail = Math.min(b.trail + step, 40);
        if (b.slide <= 0) b.rest = between(random, 3, 12);
      } else {
        b.trail = Math.max(0, b.trail - 12 * dt);
        b.rest -= dt;
        if (b.rest <= 0) {
          b.vy = between(random, 25, 70);
          b.slide = between(random, 20, 110);
        }
      }
      if (b.y - b.r > glass.h) pane.beads[i] = spawnBead(glass, false);
    }
  };

  const drawWeb = (ctx: CanvasRenderingContext2D, pane: Pane, flash: number) => {
    const { web, corner } = pane;
    ctx.save();
    ctx.translate(corner[0], corner[1]);
    if (pane.mirrored) ctx.scale(-1, 1);
    ctx.strokeStyle = `rgba(235,235,235,${0.13 + flash * 0.4})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (const [x, y] of web.spokes) {
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
    }
    for (const [ax, ay, cx, cy, bx, by] of web.threads) {
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
    }
    ctx.stroke();
    ctx.restore();

    if (!web.tie) return;
    // Lowers itself on a 56s tide and climbs back up, swaying a touch.
    const [tx, ty] = web.tie;
    const ax = corner[0] + (pane.mirrored ? -tx : tx);
    const ay = corner[1] + ty;
    const drop = 10 + (pane.glass.h * 0.3) * (0.5 - 0.5 * Math.cos((clock / 56) * TAU));
    const sx = ax + Math.sin(clock * 0.8) * 1.2;
    const sy = ay + drop;
    ctx.strokeStyle = `rgba(230,230,230,${0.12 + flash * 0.35})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    drawSpider(ctx, sx, sy, clamp(pane.frame.w * 0.022, 2.4, 3.6), flash);
  };

  const drawPane = (ctx: CanvasRenderingContext2D, pane: Pane, index: number, flash: number) => {
    const { frame, glass, spring, bar } = pane;
    const cx = frame.x + frame.w / 2;

    // Light thrown into the room around the window.
    if (flash > 0.01) {
      const spill = ctx.createRadialGradient(cx, frame.y + frame.h * 0.45, 0, cx, frame.y + frame.h * 0.45, frame.h);
      spill.addColorStop(0, `rgba(255,255,255,${0.06 * flash})`);
      spill.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spill;
      ctx.fillRect(frame.x - frame.h, frame.y - frame.h * 0.55, frame.w + frame.h * 2, frame.h * 2);
    }

    // Frame, with a faint rim so it reads against the wall.
    ctx.beginPath();
    archPath(ctx, frame);
    ctx.fillStyle = "#060606";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glass: night sky, then lightning on top of it.
    ctx.save();
    ctx.beginPath();
    archPath(ctx, glass);
    ctx.clip();
    const sky = ctx.createLinearGradient(0, glass.y, 0, glass.y + glass.h);
    sky.addColorStop(0, "#161616");
    sky.addColorStop(1, "#0c0c0c");
    ctx.fillStyle = sky;
    ctx.fillRect(glass.x, glass.y, glass.w, glass.h);
    if (flash > 0.01) {
      const lit = ctx.createLinearGradient(0, glass.y, 0, glass.y + glass.h);
      lit.addColorStop(0, `rgba(235,235,235,${0.38 * flash})`);
      lit.addColorStop(1, `rgba(235,235,235,${0.14 * flash})`);
      ctx.fillStyle = lit;
      ctx.fillRect(glass.x, glass.y, glass.w, glass.h);
    }

    ctx.translate(glass.x, glass.y);
    if (strike && strike.pane === index && flash > 0.04) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, flash * 1.4)})`;
      ctx.shadowColor = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 8;
      strike.bolt.forEach((path, i) => {
        ctx.lineWidth = i === 0 ? 1.4 : 0.8;
        ctx.beginPath();
        path.forEach(([x, y], j) => (j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }

    RAIN_LAYERS.forEach((layer, li) => {
      ctx.strokeStyle = `rgba(210,210,210,${layer.alpha * (1 + flash * 1.8)})`;
      ctx.lineWidth = layer.width;
      ctx.beginPath();
      for (const d of pane.rain[li]) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * SLANT, d.y - d.len);
      }
      ctx.stroke();
    });

    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    for (const b of pane.beads) {
      if (b.trail < 1) continue;
      ctx.moveTo(b.x, b.y - b.r);
      ctx.lineTo(b.x, b.y - b.r - b.trail);
    }
    ctx.stroke();
    for (const b of pane.beads) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + flash * 0.3})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.22 + flash * 0.5})`;
      ctx.fillRect(b.x - b.r * 0.45, b.y - b.r * 0.45, b.r * 0.5, b.r * 0.5);
    }
    ctx.restore();

    // Tracery: mullion, two transoms and a small oculus in the arch head.
    ctx.strokeStyle = "#060606";
    ctx.lineWidth = bar;
    ctx.beginPath();
    ctx.moveTo(cx, spring);
    ctx.lineTo(cx, glass.y + glass.h);
    ctx.moveTo(glass.x, spring);
    ctx.lineTo(glass.x + glass.w, spring);
    const midRail = spring + (glass.y + glass.h - spring) * 0.5;
    ctx.moveTo(glass.x, midRail);
    ctx.lineTo(glass.x + glass.w, midRail);
    ctx.stroke();
    const rise = archRise(glass.w);
    ctx.beginPath();
    ctx.arc(cx, spring - rise * 0.42, glass.w * 0.13, 0, TAU);
    ctx.stroke();

    // Sill.
    ctx.fillStyle = "#121212";
    ctx.fillRect(frame.x - 6, frame.y + frame.h, frame.w + 12, 5);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(frame.x - 6, frame.y + frame.h, frame.w + 12, 1);

    drawWeb(ctx, pane, flash);
  };

  const scene: AmbientScene = {
    resize(next) {
      stage = next;
      panes = [layoutPane(next.left, 0), layoutPane(next.right, 1)].filter((p): p is Pane => p !== null);
      strike = null;
    },
    update(dt) {
      clock += dt;
      if (!strike && clock >= nextStrike && panes.length > 0) startStrike();
      if (strike && clock - strike.start > 3) strike = null;
      for (const pane of panes) step(pane, dt);
    },
    draw(ctx, view) {
      const flash = flashLevel();
      panes.forEach((pane, i) => {
        if (inView(view, pane.frame.x, pane.frame.x + pane.frame.w)) drawPane(ctx, pane, i, flash);
      });
    },
  };
  return scene;
};

/** A spider hanging head-down from its line, grey at rest and black against a flash. */
function drawSpider(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flash: number): void {
  const shade = Math.round(46 - 38 * Math.min(1, flash * 1.5));
  const color = `rgb(${shade},${shade},${shade})`;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;

  const thorax = s * 1.55;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const angle = ((-55 + i * 33) * Math.PI) / 180;
      ctx.moveTo(0, thorax);
      ctx.lineTo(side * Math.cos(angle) * s * 1.7, thorax + Math.sin(angle) * s * 1.7 - s * 0.7);
      ctx.lineTo(side * Math.cos(angle) * s * 2.6, thorax + Math.sin(angle) * s * 2.6 + s * 0.4);
    }
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.95, s * 1.15, 0, 0, TAU);
  ctx.moveTo(s * 0.65, thorax);
  ctx.ellipse(0, thorax, s * 0.65, s * 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
