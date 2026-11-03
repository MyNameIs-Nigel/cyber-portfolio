import { easeInOutCubic } from "./view";

/**
 * What the lens does to the image at a given focus. Film shows bright points
 * out of focus as soft discs with a red-orange halo (halation, light bouncing
 * back off the film base) and colour fringes at the edges; all three shrink to
 * nothing as the image comes sharp. Real lenses also "breathe": the image
 * changes size slightly as focus moves.
 */
export interface Optics {
  /** 0 is pin sharp, 1 is fully out of focus. */
  defocus: number;
  blur: number;
  halation: number;
  aberration: number;
  breathing: number;
  /** CSS filter for the constellation and its details. */
  filter: string;
  /** CSS filter for the magnified starfield behind them. */
  backgroundFilter: string;
}

/** A sweeping lens is never quite sharp; it only snaps in once you focus on something. */
const ROAMING_DEFOCUS = 0.1;
const MAX_BLUR_PX = 8;
const MAX_ABERRATION_PX = 3.2;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * @param focus how far the focus pull has got, 0–1.
 * @param engaged how much a constellation is under the lens, 0–1 (eased in and out by the caller).
 */
export function opticsFor(focus: number, engaged: number): Optics {
  const sharp = easeInOutCubic(Math.min(1, Math.max(0, focus)));
  const defocus = engaged * (1 - sharp) + (1 - engaged) * ROAMING_DEFOCUS;
  const blur = MAX_BLUR_PX * defocus ** 1.25;
  const halation = defocus;
  const aberration = MAX_ABERRATION_PX * defocus;
  const breathing = 1 + 0.07 * defocus;

  if (defocus < 0.004) {
    return { defocus: 0, blur: 0, halation: 0, aberration: 0, breathing: 1, filter: "none", backgroundFilter: "none" };
  }

  const h = round(halation);
  const filter = [
    `blur(${round(blur)}px)`,
    // Halation: the warm halo hugging every highlight.
    `drop-shadow(0 0 ${round(3 + 12 * h)}px rgba(255, 86, 36, ${round(0.85 * h)}))`,
    // Bloom: the highlight itself spreading.
    `drop-shadow(0 0 ${round(1 + 4 * h)}px rgba(255, 214, 190, ${round(0.45 * h)}))`,
    // Lateral chromatic aberration: red one way, cyan the other.
    `drop-shadow(${round(aberration)}px 0 0 rgba(255, 48, 92, ${round(0.5 * h)}))`,
    `drop-shadow(${round(-aberration)}px 0 0 rgba(40, 188, 255, ${round(0.5 * h)}))`,
    `brightness(${round(1 + 0.3 * h)})`,
  ].join(" ");
  const backgroundFilter = `blur(${round(blur * 0.8)}px) brightness(${round(1 + 0.25 * h)})`;

  return { defocus, blur, halation, aberration, breathing, filter, backgroundFilter };
}

/**
 * The focus ring's distance scale, from close focus to infinity. Stars are
 * effectively infinitely far away, so a sharp constellation always reads ∞.
 */
export const FOCUS_SCALE = ["0.5", "0.7", "1", "1.5", "2", "3", "5", "10", "∞"] as const;

/** The distance under the index mark at a given focus, for the readout under the lens. */
export function focusDistance(focus: number): string {
  const f = Math.min(1, Math.max(0, focus));
  if (f >= 0.995) return "∞";
  // Focus distance runs roughly in reciprocal steps, like a real lens barrel.
  const metres = 0.5 / Math.max(0.0001, 1 - f) ** 1.1;
  return metres >= 10 ? `${Math.round(metres)} m` : `${metres.toFixed(1)} m`;
}
