import type { Accent } from "@/types";

/**
 * Tailwind cannot interpolate class names, so accent-driven styling goes through
 * lookup maps — the same pattern used by Roadmap, Stats and SkillCard.
 *
 * On this section accent is layer identity, not decoration:
 * 3 = source · 4 = verified (the suite, and the replicated data) · 1 = CI/healthy · 2 = host.
 */
export const accentText: Record<Accent, string> = {
  1: "text-accent-1",
  2: "text-accent-2",
  3: "text-accent-3",
  4: "text-accent-4",
};

/** Marker outline. Kept separate from the wash so the wash can sit on its own opaque layer. */
export const accentRing: Record<Accent, string> = {
  1: "border-accent-1",
  2: "border-accent-2",
  3: "border-accent-3",
  4: "border-accent-4",
};

/** Translucent wash. Always layered over an opaque ground, never over the rail. */
export const accentFill: Record<Accent, string> = {
  1: "bg-accent-1/15",
  2: "bg-accent-2/15",
  3: "bg-accent-3/15",
  4: "bg-accent-4/15",
};

export const accentChip: Record<Accent, string> = {
  1: "border-accent-1/25 bg-accent-1/10 text-accent-1",
  2: "border-accent-2/25 bg-accent-2/10 text-accent-2",
  3: "border-accent-3/25 bg-accent-3/10 text-accent-3",
  4: "border-accent-4/25 bg-accent-4/10 text-accent-4",
};

/** Bottom border colour — used for CSS-triangle arrowheads, which have no fill. */
export const accentArrowUp: Record<Accent, string> = {
  1: "border-b-accent-1",
  2: "border-b-accent-2",
  3: "border-b-accent-3",
  4: "border-b-accent-4",
};
