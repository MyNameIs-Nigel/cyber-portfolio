/*
 * Synchronous fireflies (Photinus carolinus) start out blinking on their own and
 * gradually fall into step because each one nudges its rhythm toward the flashes
 * it sees. That is the Kuramoto model: every oscillator is pulled toward the
 * group's mean phase, with strength `coupling`.
 */

const TAU = Math.PI * 2;

/** How tightly the swarm is in step (0 scattered … 1 in unison) and its mean phase. */
export function orderParameter(phases: readonly number[]): { r: number; psi: number } {
  if (phases.length === 0) return { r: 0, psi: 0 };
  let re = 0;
  let im = 0;
  for (const p of phases) {
    re += Math.cos(p);
    im += Math.sin(p);
  }
  re /= phases.length;
  im /= phases.length;
  return { r: Math.hypot(re, im), psi: Math.atan2(im, re) };
}

/** Advances every phase by `dt` seconds under mean-field coupling. Mutates `phases`. */
export function stepPhases(phases: number[], frequencies: readonly number[], coupling: number, dt: number): void {
  const { r, psi } = orderParameter(phases);
  for (let i = 0; i < phases.length; i++) {
    const next = phases[i] + (frequencies[i] + coupling * r * Math.sin(psi - phases[i])) * dt;
    phases[i] = ((next % TAU) + TAU) % TAU;
  }
}

/** Brightness 0–1 for a phase: a quick rise into the flash at 0, then a slower fade. */
export function flashIntensity(phase: number): number {
  const d = ((phase + Math.PI) % TAU + TAU) % TAU - Math.PI; // wrap to (-π, π]
  const width = d < 0 ? 0.22 : 0.6;
  return Math.exp(-((d / width) ** 2));
}

/*
 * Coupling over one cycle: the swarm drifts independently, is drawn together,
 * holds in unison for a while, then lets go. The offset makes the first
 * gathering start a few seconds after the page opens rather than a minute in.
 */
const CYCLE = 80;
const OFFSET = 14;
const LOOSE = 0.04;
const TIGHT = 1.5;

export function couplingAt(seconds: number): number {
  const t = (seconds + OFFSET) % CYCLE;
  const smooth = (x: number) => x * x * (3 - 2 * x);
  if (t < 25) return LOOSE;
  if (t < 42) return LOOSE + (TIGHT - LOOSE) * smooth((t - 25) / 17);
  if (t < 68) return TIGHT;
  return TIGHT - (TIGHT - LOOSE) * smooth((t - 68) / 12);
}
