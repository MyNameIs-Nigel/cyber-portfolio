/** How far the sky scrolls, in large-viewport heights. The section is this tall; the view is pinned inside it. */
export const SKY_HEIGHT_LVH = 340;

/** Sky backing-store limit: retina laptops stay sharp, 5K screens trade a little of it to keep 60fps. */
export const MAX_DPR = 2;
export const PIXEL_BUDGET = 4_600_000;

/** Seed for the starfield, so every visitor (and every reload) sees the same sky. */
export const SKY_SEED = 0x5eed_2027;

/**
 * Parallax depths. 1 is the constellation plane, which moves 1:1 with the
 * scroll; nearer 0 is farther away, so it pans and zooms less.
 */
export const DEPTH = {
  milkyWay: 0.18,
  far: 0.32,
  mid: 0.56,
  near: 0.84,
  constellations: 1,
} as const;

/** Field stars per million square pixels of layer, per depth. */
export const STAR_DENSITY = { far: 1050, mid: 250, near: 52 } as const;

/** The spyglass is drawn at this size and scaled, so its engraving stays crisp. */
export const LENS_DESIGN_PX = 420;
export const LENS = {
  /** Diameter while sweeping the sky. */
  roam: 236,
  /** Diameter once a constellation is under it. */
  engaged: 420,
  /** Magnification while sweeping. Once engaged, it frames the constellation instead. */
  magnification: 2.1,
} as const;

/** The viewfinder on touch screens: smaller while scanning, as wide as the phone allows once it locks on. */
/** `sideMargin` leaves room for the barrel, which sits outside the glass. */
export const VIEWFINDER = { roam: 196, engagedMax: 348, sideMargin: 40, centerY: 0.44 } as const;

/** Hold time to bring a constellation into focus with the mouse. */
export const HOLD_TO_FOCUS_MS = 1500;
/** Keyboard users get the same focus pull, played for them. */
export const AUTO_FOCUS_MS = 1100;
/** How quickly focus drifts back out when the button is released. */
export const FOCUS_RELEASE_MS = 700;
/** Horizontal drag on the focus ring needed to go from blurred to sharp. */
export const DIAL_TRAVEL_PX = 260;

/** The "pointing the telescope" move when a constellation locks. */
export const ZOOM = { scale: 2.15, inMs: 1250, outMs: 950, overlayDelayMs: 380 } as const;

/** Visited constellations, so the chart remembers what you've already found. */
export const VISITED_STORAGE_KEY = "about.constellations.visited";
