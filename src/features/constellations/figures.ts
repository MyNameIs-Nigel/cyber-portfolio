import type { InterestId } from "@/types";
import type { Figure, PlacedConstellation, Placement, SkyLayout } from "./constellations.types";

/*
 * Each interest is drawn the way old atlases drew Orion as a hunter: a handful
 * of stars that, once joined up, read as the thing itself. Units are roughly
 * ±150 across with y pointing down.
 */
export const FIGURES: Record<InterestId, Figure> = {
  // A camera body with its prism hump, a shutter button, and the lens as a ring.
  photography: {
    stars: [
      [-122, -38, 2],
      [-40, -38, 3],
      [-26, -78, 2],
      [26, -78, 2],
      [40, -38, 3],
      [88, -38, 4],
      [122, -38, 2],
      [122, 62, 3],
      [-122, 62, 3],
      [0, 14, 1],
      [88, -58, 3],
      [-92, -12, 4],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 0],
      [5, 10],
    ],
    rings: [
      { star: 9, r: 38 },
      { star: 9, r: 15 },
    ],
    extent: 150,
  },
  // Two beamed eighth notes.
  music: {
    stars: [
      [-84, 60, 1],
      [-66, -64, 3],
      [74, 34, 1],
      [92, -90, 2],
      [-68, -36, 4],
      [90, -62, 4],
      [-8, -76, 4],
    ],
    lines: [
      [0, 1],
      [1, 6],
      [6, 3],
      [3, 2],
      [4, 5],
    ],
    rings: [
      { star: 0, r: 17 },
      { star: 2, r: 17 },
    ],
    extent: 140,
  },
  // </> — the oldest constellation in the developer sky.
  coding: {
    stars: [
      [-78, -60, 2],
      [-140, 0, 1],
      [-78, 60, 2],
      [-22, 72, 3],
      [22, -72, 3],
      [78, -60, 2],
      [140, 0, 1],
      [78, 60, 2],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [3, 4],
      [5, 6],
      [6, 7],
    ],
    extent: 160,
  },
  // A long-hood coupe in profile, with the wheels as rings.
  cars: {
    stars: [
      [-150, 20, 3],
      [-146, -10, 3],
      [-98, -18, 2],
      [-58, -54, 2],
      [16, -56, 2],
      [56, -20, 2],
      [140, -8, 3],
      [152, 20, 3],
      [-92, 26, 1],
      [94, 26, 1],
      [-56, 22, 4],
      [56, 22, 4],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [10, 11],
    ],
    rings: [
      { star: 8, r: 27 },
      { star: 9, r: 27 },
    ],
    extent: 165,
  },
};

/**
 * Staggered down the sky: top middle-right, upper-middle left, just left of
 * center, then bottom right. `y` is a fraction of the whole scroll height.
 */
export const PLACEMENTS: Record<InterestId, Placement> = {
  photography: { x: 0.64, y: 0.15, touchX: 0.55, touchY: 0.21, tilt: -7 },
  music: { x: 0.25, y: 0.37, touchX: 0.45, touchY: 0.41, tilt: 5 },
  coding: { x: 0.41, y: 0.59, touchX: 0.48, touchY: 0.61, tilt: -4 },
  cars: { x: 0.75, y: 0.84, touchX: 0.55, touchY: 0.83, tilt: 4 },
};

/** Figure scale for a viewport width: about 260px across on a laptop, never cramped on a phone. */
export function figureScale(width: number, touch: boolean): number {
  if (touch && width < 640) return Math.min(0.86, Math.max(0.62, width / 470));
  return Math.min(1.08, Math.max(0.66, width / 1400));
}

export function layoutSky(
  ids: readonly InterestId[],
  width: number,
  height: number,
  worldHeight: number,
  touch: boolean,
): SkyLayout {
  const scale = figureScale(width, touch);
  const narrow = touch && width < 640;
  const constellations: PlacedConstellation[] = ids.map((id) => {
    const figure = FIGURES[id];
    const place = PLACEMENTS[id];
    const cx = (narrow ? place.touchX : place.x) * width;
    const cy = (narrow ? place.touchY : place.y) * worldHeight;
    const rad = (place.tilt * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const at = (x: number, y: number) => ({
      x: cx + (x * cos - y * sin) * scale,
      y: cy + (x * sin + y * cos) * scale,
    });
    return {
      id,
      x: cx,
      y: cy,
      scale,
      radius: figure.extent * scale,
      stars: figure.stars.map(([x, y, mag]) => ({ ...at(x, y), mag })),
      lines: figure.lines,
      rings: (figure.rings ?? []).map(({ star, r }) => {
        const [x, y] = figure.stars[star];
        return { ...at(x, y), r: r * scale };
      }),
    };
  });
  return { width, height, worldHeight, touch, constellations };
}
