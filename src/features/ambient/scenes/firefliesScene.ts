import type { AmbientScene, SceneFactory, Stage } from "../ambient.types";
import { couplingAt, flashIntensity, stepPhases } from "./fireflySync";
import { between, clamp, createGlow, inView, isMasked, TAU } from "./sceneUtils";

/*
 * Summer dusk: a warm glow low on the horizon, grass swaying along the bottom of
 * each gutter, and fireflies. They start out blinking on their own and, if you
 * stay a while, drift into blinking together (see `fireflySync`) before letting
 * go again. They are curious, too — park the cursor in a gutter and the nearest
 * ones wander over to circle it.
 */

/** How far, in px, a firefly notices the cursor. */
const CURIOSITY_RADIUS = 190;

interface Firefly {
  x: number;
  y: number;
  heading: number;
  speed: number;
  turn: number;
  turnPhase: number;
  size: number;
  depth: number;
  side: 0 | 1;
  orbit: 1 | -1;
}

interface Blade {
  x: number;
  h: number;
  w: number;
  lean: number;
}

interface Region {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Signed shortest turn from angle `from` to angle `to`. */
function turnToward(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export const createFirefliesScene: SceneFactory = (random) => {
  let stage: Stage | null = null;
  let flies: Firefly[] = [];
  let phases: number[] = [];
  let frequencies: number[] = [];
  let blades: Blade[] = [];
  let regions: [Region, Region] | null = null;
  let glow: HTMLCanvasElement | null = null;
  let pointer: { x: number; y: number } | null = null;
  let clock = 0;

  const scene: AmbientScene = {
    // A last warm glow on the horizon under a deepening blue.
    backdrop:
      "linear-gradient(to top, rgba(249,115,22,0.055), rgba(249,115,22,0) 40%, rgba(60,72,150,0) 70%, rgba(60,72,150,0.05))",

    resize(next, dpr) {
      stage = next;
      const top = next.height * 0.28;
      const bottom = next.height - 20;
      regions = [
        { x0: 8, x1: next.gutter + 16, y0: top, y1: bottom },
        { x0: next.width - next.gutter - 16, x1: next.width - 8, y0: top, y1: bottom },
      ];

      const perSide = clamp(Math.round((next.gutter * (bottom - top)) / 16000), 7, 22);
      flies = [];
      for (const side of [0, 1] as const) {
        const r = regions[side];
        for (let i = 0; i < perSide; i++) {
          const depth = between(random, 0.45, 1);
          flies.push({
            x: between(random, r.x0, r.x1),
            // Thicker near the grass, thinning out higher up.
            y: r.y1 - (r.y1 - r.y0) * random() ** 1.5,
            heading: random() * TAU,
            speed: between(random, 5, 12),
            turn: between(random, 0.3, 0.9),
            turnPhase: random() * TAU,
            size: between(random, 13, 22) * (0.7 + depth * 0.3),
            depth,
            side,
            orbit: random() < 0.5 ? 1 : -1,
          });
        }
      }
      phases = flies.map(() => random() * TAU);
      frequencies = flies.map(() => TAU / between(random, 2.9, 3.6));

      blades = [];
      for (const [x0, x1] of [
        [0, next.reach],
        [next.width - next.reach, next.width],
      ]) {
        for (let x = x0; x < x1; x += between(random, 2.5, 5)) {
          const tall = random() < 0.1;
          blades.push({
            x,
            h: tall ? between(random, 46, 70) : between(random, 14, 38),
            w: between(random, 2, 3.6),
            lean: between(random, -5, 5),
          });
        }
      }

      glow = createGlow(22, dpr, [
        [0, "rgba(255,255,220,1)"],
        [0.08, "rgba(236,252,150,0.8)"],
        [0.3, "rgba(190,235,90,0.26)"],
        [0.6, "rgba(170,225,80,0.07)"],
        [1, "rgba(160,220,70,0)"],
      ]);
    },

    pointer(x, y) {
      pointer = x === null || y === null || !stage || isMasked(stage, x) ? null : { x, y };
    },

    update(dt) {
      if (!regions) return;
      clock += dt;
      stepPhases(phases, frequencies, couplingAt(clock), dt);
      for (const f of flies) {
        f.heading += Math.sin(clock * f.turn + f.turnPhase) * 0.9 * dt + (random() - 0.5) * 0.6 * dt;

        let target: number | null = null;
        let pull = 0;
        let speed = f.speed;
        const home = regions[f.side];
        if (f.x < home.x0 || f.x > home.x1 || f.y < home.y0 || f.y > home.y1) {
          target = Math.atan2((home.y0 + home.y1) / 2 - f.y, (home.x0 + home.x1) / 2 - f.x);
          pull = 1.2;
        }
        if (pointer) {
          const dx = pointer.x - f.x;
          const dy = pointer.y - f.y;
          const d = Math.hypot(dx, dy);
          if (d < CURIOSITY_RADIUS) {
            const toward = Math.atan2(dy, dx);
            // Close in, then circle rather than land on it.
            target = d < 36 ? toward + (Math.PI / 2) * f.orbit : toward;
            pull = 0.4 + 1.6 * (1 - d / CURIOSITY_RADIUS);
            speed *= 1.4;
          }
        }
        if (target !== null) f.heading += turnToward(f.heading, target) * Math.min(1, pull * dt * 1.5);

        f.x += Math.cos(f.heading) * speed * dt;
        f.y += Math.sin(f.heading) * speed * dt + Math.sin(clock * 1.7 + f.turnPhase) * 3 * dt;
      }
    },

    draw(ctx, view) {
      if (!stage) return;
      // Grass: one filled path, swaying on a slow gust that rolls across the meadow.
      const gust = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(clock * 0.23));
      const base = stage.height + 2;
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      for (const b of blades) {
        if (!inView(view, b.x - 20, b.x + 20)) continue;
        const sway = b.lean + Math.sin(clock * 1.1 - b.x * 0.012) * gust * b.h * 0.14;
        const left = b.x - b.w / 2;
        const right = b.x + b.w / 2;
        ctx.moveTo(left, base);
        ctx.quadraticCurveTo(left + sway * 0.35, base - b.h * 0.55, b.x + sway, base - b.h);
        ctx.quadraticCurveTo(right + sway * 0.35, base - b.h * 0.55, right, base);
      }
      ctx.fill();

      if (!glow) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#fbffd0";
      for (let i = 0; i < flies.length; i++) {
        const f = flies[i];
        if (!inView(view, f.x - f.size, f.x + f.size)) continue;
        const flash = flashIntensity(phases[i]);
        ctx.globalAlpha = (0.05 + 0.95 * flash) * f.depth * 0.9;
        ctx.drawImage(glow, f.x - f.size, f.y - f.size, f.size * 2, f.size * 2);
        ctx.globalAlpha = Math.min(1, 0.18 + flash) * f.depth;
        ctx.fillRect(f.x - 0.8, f.y - 0.8, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
  };
  return scene;
};
