import {
  COLUMN_CLEARANCE,
  CONTENT_WIDTH,
  GUTTER_FADE,
  MAX_DPR,
  MIN_VIEWPORT_WIDTH,
  PIXEL_BUDGET,
} from "./ambient.constants";
import type { Stage } from "./ambient.types";

/** Distance from the viewport center to where the backdrop starts fading in. */
export const CLEAR_HALF_WIDTH = CONTENT_WIDTH / 2 + COLUMN_CLEARANCE;
/** Distance from the viewport center to where the backdrop is fully visible. */
export const VISIBLE_HALF_WIDTH = CLEAR_HALF_WIDTH + GUTTER_FADE;

/** CSS masks that soften each gutter canvas's edge against the content column. */
export const GUTTER_MASKS = {
  left: `linear-gradient(to right, #000 calc(100% - ${GUTTER_FADE}px), transparent)`,
  right: `linear-gradient(to left, #000 calc(100% - ${GUTTER_FADE}px), transparent)`,
} as const;

/** Lays out the two side gutters, or returns null when the viewport is too narrow to bother. */
export function computeStage(width: number, height: number): Stage | null {
  if (width < MIN_VIEWPORT_WIDTH || height <= 0) return null;
  const reach = width / 2 - CLEAR_HALF_WIDTH;
  const gutter = width / 2 - VISIBLE_HALF_WIDTH;
  return {
    width,
    height,
    gutter,
    reach,
    left: { x0: 0, x1: gutter },
    right: { x0: width - gutter, x1: width },
  };
}

/** Backing-store scale for the gutter canvases: the device ratio, held to `PIXEL_BUDGET`. */
export function backingScale(deviceRatio: number, stage: Stage): number {
  const fit = Math.sqrt(PIXEL_BUDGET / (2 * stage.reach * stage.height));
  return Math.max(1, Math.min(deviceRatio || 1, MAX_DPR, fit));
}
