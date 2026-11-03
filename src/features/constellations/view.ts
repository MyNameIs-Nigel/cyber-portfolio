import type { Camera, View } from "./constellations.types";

/**
 * Where a layer at `depth` lands on a `width`×`height` screen. Depth 1 is the
 * constellation plane and tracks the camera exactly; farther layers pan and
 * zoom proportionally less, which is what makes the sky read as deep.
 */
export function layerView(cam: Camera, depth: number, width: number, height: number): View {
  const scale = 1 + (cam.zoom - 1) * depth;
  // The layer's own coordinate that sits at the middle of the screen.
  const ox = (cam.cx - width / 2) * depth + width / 2;
  const oy = (cam.cy - height / 2) * depth + height / 2;
  return { scale, tx: width / 2 - ox * scale, ty: height / 2 - oy * scale };
}

/**
 * The same view seen through a magnifier: screen point (ax, ay) is enlarged by
 * `factor` and lands at (cx, cy) of the magnifier's own canvas.
 */
export function magnify(view: View, ax: number, ay: number, factor: number, cx: number, cy: number): View {
  return {
    scale: view.scale * factor,
    tx: (view.tx - ax) * factor + cx,
    ty: (view.ty - ay) * factor + cy,
  };
}

export function project(view: View, x: number, y: number): [number, number] {
  return [x * view.scale + view.tx, y * view.scale + view.ty];
}

export function unproject(view: View, x: number, y: number): [number, number] {
  return [(x - view.tx) / view.scale, (y - view.ty) / view.scale];
}

/** The CSS transform that puts an absolutely positioned layer (origin top-left) under `view`. */
export function cssTransform(view: View): string {
  return `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${view.scale})`;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Frame-rate independent approach of `current` toward `target`; `rate` is roughly 1/seconds. */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
