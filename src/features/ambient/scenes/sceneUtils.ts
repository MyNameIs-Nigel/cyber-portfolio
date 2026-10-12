import type { Span, Stage } from "../ambient.types";

export const TAU = Math.PI * 2;

export function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** True when `x` is over the content column rather than a gutter. */
export function isMasked(stage: Stage, x: number): boolean {
  return x > stage.reach && x < stage.width - stage.reach;
}

/** True when the horizontal run [x0, x1] overlaps `view`. */
export function inView(view: Span, x0: number, x1: number = x0): boolean {
  return x1 >= view.x0 && x0 <= view.x1;
}

/** A canvas sized for `dpr`, with its context already scaled to CSS pixels. */
export function createSprite(
  width: number,
  height: number,
  dpr: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * dpr));
  canvas.height = Math.max(1, Math.ceil(height * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

/** A soft round glow, pre-rendered once so each particle is a single drawImage. */
export function createGlow(radius: number, dpr: number, stops: Array<[number, string]>): HTMLCanvasElement | null {
  const sprite = createSprite(radius * 2, radius * 2, dpr);
  if (!sprite) return null;
  const gradient = sprite.ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  sprite.ctx.fillStyle = gradient;
  sprite.ctx.fillRect(0, 0, radius * 2, radius * 2);
  return sprite.canvas;
}
