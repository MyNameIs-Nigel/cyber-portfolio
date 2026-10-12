import type { AmbientScene, SceneFactory, Stage } from "../ambient.types";
import { getMoonPhase, isSouthernHemisphereZone, type MoonPhase } from "../moonPhase";
import { between, clamp, createGlow, createSprite, inView, TAU } from "./sceneUtils";

/*
 * A clear night: a slow field of twinkling stars drifting across both gutters,
 * the odd shooting star, a satellite every minute or so, and tonight's Moon —
 * the real phase, lit on the correct side for the visitor's hemisphere.
 */

const STAR_TINTS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffecd6", "#d6e2ff"];

/**
 * The large maria of the near side as soft ellipses, in Moon radii as seen from
 * the northern hemisphere (x right, y down): [x, y, rx, ry, opacity].
 */
const MARIA: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [-0.6, -0.05, 0.32, 0.45, 0.2], // Oceanus Procellarum
  [-0.45, 0.2, 0.22, 0.25, 0.16], // …its southern spread
  [-0.27, -0.42, 0.3, 0.24, 0.24], // Imbrium
  [0.2, -0.38, 0.17, 0.16, 0.24], // Serenitatis
  [0.3, -0.1, 0.22, 0.18, 0.24], // Tranquillitatis
  [0.05, -0.22, 0.12, 0.08, 0.16], // Vaporum, joining Imbrium to Serenitatis
  [0.69, -0.28, 0.11, 0.13, 0.26], // Crisium
  [0.56, 0.12, 0.13, 0.17, 0.2], // Fecunditatis
  [0.37, 0.3, 0.1, 0.09, 0.18], // Nectaris
  [-0.2, 0.37, 0.2, 0.15, 0.18], // Nubium
  [-0.5, 0.43, 0.09, 0.09, 0.2], // Humorum
  [-0.04, -0.72, 0.44, 0.08, 0.16], // Frigoris
];

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  twinkle: number;
  freq: number;
  phase: number;
  tint: string;
}

interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  len: number;
}

/** The disc as it would look fully lit: limb-darkened highlands, maria, and bright Tycho. */
function paintSurface(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.clip();

  const base = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
  base.addColorStop(0, "#f2efe7");
  base.addColorStop(1, "#d3cec4");
  ctx.fillStyle = base;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  for (const [mx, my, rx, ry, a] of MARIA) {
    ctx.save();
    ctx.translate(mx * r, my * r);
    ctx.scale(1, ry / rx);
    const blob = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * r);
    blob.addColorStop(0, `rgba(96,94,88,${a})`);
    blob.addColorStop(0.45, `rgba(96,94,88,${a * 0.8})`);
    blob.addColorStop(1, "rgba(96,94,88,0)");
    ctx.fillStyle = blob;
    ctx.beginPath();
    ctx.arc(0, 0, rx * r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  const tycho = ctx.createRadialGradient(-0.13 * r, 0.72 * r, 0, -0.13 * r, 0.72 * r, r * 0.09);
  tycho.addColorStop(0, "rgba(255,255,255,0.7)");
  tycho.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = tycho;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  const limb = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
  limb.addColorStop(0, "rgba(0,0,0,0)");
  limb.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = limb;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

/**
 * Outline of the sunlit part of the disc. Drawn in northern-hemisphere
 * orientation, where a waxing Moon is lit from the right: the bright limb is a
 * half circle and the terminator a half ellipse whose width follows the phase.
 */
function litRegion(ctx: CanvasRenderingContext2D, r: number, moon: MoonPhase): void {
  const k = moon.illumination;
  const side = moon.waxing ? 1 : -1;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, -Math.PI / 2, Math.PI / 2, side < 0);
  // Crescent: the terminator bows toward the bright limb. Gibbous: away from it.
  ctx.ellipse(0, 0, r * Math.abs(1 - 2 * k), r, 0, Math.PI / 2, -Math.PI / 2, (k < 0.5) === side > 0);
  ctx.closePath();
}

const LABEL_FONT = '10px "JetBrains Mono Variable", ui-monospace, monospace';

function measureLabel(text: string): number {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * 7;
  ctx.font = LABEL_FONT;
  return ctx.measureText(text).width;
}

interface MoonSprite {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

function paintMoon(cx: number, cy: number, r: number, dpr: number, date: Date): MoonSprite | null {
  const moon = getMoonPhase(date);
  let zone: string | undefined;
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    zone = undefined;
  }
  const southern = isSouthernHemisphereZone(zone);

  const label = `${moon.name} · ${Math.round(moon.illumination * 100)}%`;
  const halo = r * 4;
  const labelGap = r + 20;
  // On narrow gutters the Moon shrinks but its caption doesn't, so size for whichever is wider.
  const w = Math.max(halo * 2, Math.ceil(measureLabel(label)) + 8);
  const mid = w / 2;
  const h = halo + Math.max(halo, labelGap + 6);
  const sprite = createSprite(w, h, dpr);
  if (!sprite) return null;
  const { ctx } = sprite;

  const glow = ctx.createRadialGradient(mid, halo, r * 0.9, mid, halo, halo);
  glow.addColorStop(0, `rgba(225,228,240,${0.05 + 0.1 * moon.illumination})`);
  glow.addColorStop(1, "rgba(225,228,240,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, halo * 2);

  ctx.save();
  ctx.translate(mid, halo);
  // South of the equator the whole Moon — maria, lit limb and all — appears upside down.
  if (southern) ctx.rotate(Math.PI);

  // Earthshine: the night side is faintly lit by sunlight bouncing off Earth.
  ctx.globalAlpha = 0.07;
  paintSurface(ctx, r);
  ctx.globalAlpha = 1;

  ctx.save();
  litRegion(ctx, r, moon);
  ctx.clip();
  paintSurface(ctx, r);
  ctx.restore();
  ctx.restore();

  ctx.font = LABEL_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(229,229,229,0.28)";
  ctx.fillText(label, mid, halo + labelGap);

  return { canvas: sprite.canvas, x: cx - mid, y: cy - halo, w, h };
}

export const createNightScene: SceneFactory = (random) => {
  let stage: Stage | null = null;
  let stars: Star[] = [];
  let starGlow: HTMLCanvasElement | null = null;
  let moon: MoonSprite | null = null;
  let clock = 0;
  let meteor: Streak | null = null;
  let nextMeteor = between(random, 3, 7);
  let satellite: Streak | null = null;
  let nextSatellite = between(random, 25, 45);

  const makeStar = (width: number, height: number): Star => {
    const size = 0.45 + 1.25 * random() ** 3;
    return {
      x: random() * width,
      y: random() * height,
      size,
      alpha: clamp(0.2 + size * 0.35 + random() * 0.25, 0, 0.95),
      // Bigger reads as nearer, so it drifts a little faster.
      speed: 1.2 + size * 2.4,
      twinkle: between(random, 0.15, 0.55),
      freq: between(random, 0.6, 2.2),
      phase: random() * TAU,
      tint: STAR_TINTS[Math.floor(random() * STAR_TINTS.length)],
    };
  };

  const launchMeteor = (s: Stage) => {
    const left = random() < 0.5;
    const span = left ? s.left : s.right;
    // Mostly away from the column, so the trail has room to finish in view.
    const outward = random() < 0.7;
    const dir = left === outward ? -1 : 1;
    const angle = between(random, 0.3, 0.65);
    const speed = between(random, 480, 720);
    const inset = s.gutter * 0.15;
    meteor = {
      x: between(random, span.x0 + inset, span.x1 - inset),
      y: between(random, 70, s.height * 0.45),
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: between(random, 0.55, 0.95),
      len: between(random, 70, 130),
    };
    nextMeteor = clock + between(random, 5, 13);
  };

  const launchSatellite = (s: Stage) => {
    const span = random() < 0.5 ? s.left : s.right;
    const inset = s.gutter * 0.2;
    const vy = between(random, 18, 28);
    satellite = {
      x: between(random, span.x0 + inset, span.x1 - inset),
      y: -4,
      vx: between(random, -6, 6),
      vy,
      age: 0,
      life: (s.height + 8) / vy,
      len: 0,
    };
    nextSatellite = clock + satellite.life + between(random, 40, 90);
  };

  const buildMoon = (dpr: number) => {
    if (!stage) return;
    const r = clamp(stage.gutter * 0.085, 13, 24);
    const cx = (stage.right.x0 + stage.right.x1) / 2;
    const cy = clamp(stage.height * 0.16, 110, 200);
    moon = paintMoon(cx, cy, r, dpr, new Date());
  };

  const scene: AmbientScene = {
    backdrop: "linear-gradient(to bottom, rgba(40,58,120,0.07), rgba(40,58,120,0) 75%)",

    resize(next, dpr) {
      stage = next;
      const count = Math.round((next.width * next.height) / 3800);
      stars = Array.from({ length: count }, () => makeStar(next.width, next.height));
      starGlow = createGlow(6, dpr, [
        [0, "rgba(255,255,255,0.9)"],
        [0.3, "rgba(255,255,255,0.25)"],
        [1, "rgba(255,255,255,0)"],
      ]);
      buildMoon(dpr);
      // The label is set in JetBrains Mono; repaint once the webfont is actually there.
      if (typeof document !== "undefined" && document.fonts?.status === "loading") {
        document.fonts.ready.then(() => stage === next && buildMoon(dpr)).catch(() => {});
      }
    },

    update(dt) {
      if (!stage) return;
      clock += dt;
      for (const star of stars) {
        star.x += star.speed * dt;
        if (star.x > stage.width + 3) star.x -= stage.width + 6;
      }

      if (!meteor && clock >= nextMeteor) launchMeteor(stage);
      if (meteor) {
        meteor.age += dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        if (meteor.age >= meteor.life) meteor = null;
      }

      if (!satellite && clock >= nextSatellite) launchSatellite(stage);
      if (satellite) {
        satellite.age += dt;
        satellite.x += satellite.vx * dt;
        satellite.y += satellite.vy * dt;
        if (satellite.age >= satellite.life) satellite = null;
      }
    },

    draw(ctx, view) {
      if (!stage) return;
      for (const star of stars) {
        if (!inView(view, star.x - 6, star.x + 6)) continue;
        const shimmer =
          0.6 * Math.sin(clock * star.freq + star.phase) + 0.4 * Math.sin(clock * star.freq * 2.3 + star.phase * 1.7);
        const a = star.alpha * (1 - star.twinkle * (0.5 + 0.5 * shimmer));
        ctx.globalAlpha = a;
        ctx.fillStyle = star.tint;
        if (star.size < 1.2) {
          ctx.fillRect(star.x - star.size / 2, star.y - star.size / 2, star.size, star.size);
        } else {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.6, 0, TAU);
          ctx.fill();
          if (starGlow) {
            ctx.globalAlpha = a * 0.45;
            ctx.drawImage(starGlow, star.x - 6, star.y - 6, 12, 12);
          }
        }
      }
      ctx.globalAlpha = 1;

      if (satellite) {
        const fade = Math.min(1, satellite.age / 2, (satellite.life - satellite.age) / 2);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.max(0, fade)})`;
        ctx.fillRect(satellite.x - 0.6, satellite.y - 0.6, 1.2, 1.2);
      }

      if (meteor) {
        const p = meteor.age / meteor.life;
        const a = Math.sin(Math.PI * Math.min(1, p)) ** 1.2 * 0.8;
        const speed = Math.hypot(meteor.vx, meteor.vy);
        const tail = meteor.len * Math.min(1, p * 2.5);
        const tx = meteor.x - (meteor.vx / speed) * tail;
        const ty = meteor.y - (meteor.vy / speed) * tail;
        const trail = ctx.createLinearGradient(tx, ty, meteor.x, meteor.y);
        trail.addColorStop(0, "rgba(255,255,255,0)");
        trail.addColorStop(1, `rgba(255,255,255,${a})`);
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1.1, 0, TAU);
        ctx.fill();
      }

      if (moon && inView(view, moon.x, moon.x + moon.w)) ctx.drawImage(moon.canvas, moon.x, moon.y, moon.w, moon.h);
    },
  };
  return scene;
};
