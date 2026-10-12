/** Every backdrop; `?ambient=<id>` pins any of them. Order is only used for docs and tests. */
export const AMBIENT_SCENES = ["storm", "night", "fireflies"] as const;
/** What every visitor sees unless the URL asks for something else. */
export const DEFAULT_SCENE = "night" satisfies (typeof AMBIENT_SCENES)[number];

/** Width of the centered content column (see `Container`). */
export const CONTENT_WIDTH = 768;
/** Breathing room kept clear on each side of the column. */
export const COLUMN_CLEARANCE = 12;
/** Width of the soft edge between the clear column and a fully visible gutter. */
export const GUTTER_FADE = 56;
/** Below this viewport width the gutters are too thin to hold a scene, so nothing runs. */
export const MIN_VIEWPORT_WIDTH = 1180;

/** Retina is plenty for soft particles; 3x screens would more than double the fill cost for nothing. */
export const MAX_DPR = 2;
/**
 * Most device pixels both gutter canvases may hold together. A 1440px retina
 * laptop fits at full sharpness; 4K/5K screens trade a little of it for a
 * redraw that stays cheap even where canvas is rasterised on the CPU.
 */
export const PIXEL_BUDGET = 2_500_000;
/** Everything here moves slowly; 30fps looks the same and costs half. */
export const FRAME_INTERVAL_MS = 1000 / 30;

/** `?ambient=night` pins a scene, for previews and screenshots. */
export const SCENE_QUERY_PARAM = "ambient";
