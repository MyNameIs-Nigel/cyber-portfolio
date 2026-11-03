import type { InterestId } from "@/types";

/** An affine map from a layer's own coordinates to canvas pixels: q = p · scale + (tx, ty). */
export interface View {
  scale: number;
  tx: number;
  ty: number;
}

/** The camera, in constellation-plane (depth 1) coordinates. */
export interface Camera {
  /** World point at the center of the screen. */
  cx: number;
  cy: number;
  zoom: number;
}

/** A constellation figure in its own units: roughly ±150 across, y down. */
export interface Figure {
  /** [x, y, magnitude] — magnitude 1 is the brightest, 4 the faintest. */
  stars: ReadonlyArray<readonly [number, number, number]>;
  /** Pairs of star indices joined by a line, in the order they are drawn. */
  lines: ReadonlyArray<readonly [number, number]>;
  /** Circles around a star: a lens, a wheel, a note head. */
  rings?: ReadonlyArray<{ star: number; r: number }>;
  /** Hit radius, in figure units. */
  extent: number;
}

/** Where a constellation sits on the chart, as fractions of the sky's width and height. */
export interface Placement {
  x: number;
  y: number;
  /** Position on narrow touch screens, where the viewfinder tracks to it and the intro needs room. */
  touchX: number;
  touchY: number;
  /** Degrees; real constellations are never square to the frame. */
  tilt: number;
}

/** A constellation laid out in world pixels for the current viewport. */
export interface PlacedConstellation {
  id: InterestId;
  x: number;
  y: number;
  scale: number;
  /** Hit radius in world pixels. */
  radius: number;
  stars: Array<{ x: number; y: number; mag: number }>;
  lines: ReadonlyArray<readonly [number, number]>;
  rings: Array<{ x: number; y: number; r: number }>;
}

export interface SkyLayout {
  width: number;
  height: number;
  worldHeight: number;
  touch: boolean;
  constellations: PlacedConstellation[];
}

export type LensMode = "spyglass" | "viewfinder";
