import type { Accent } from "@/types";

/**
 * Tailwind cannot interpolate class names, so accent-driven styling goes through
 * lookup maps — the same pattern used by Roadmap, Stats and SkillCard.
 *
 * On this section accent is layer identity, not decoration:
 * 3 = source · 1 = CI/healthy · 2 = host · 4 = data.
 */
export const accentText: Record<Accent, string> = {
  1: "text-accent-1",
  2: "text-accent-2",
  3: "text-accent-3",
  4: "text-accent-4",
};

export const accentBorder: Record<Accent, string> = {
  1: "border-accent-1/40",
  2: "border-accent-2/40",
  3: "border-accent-3/40",
  4: "border-accent-4/40",
};

export const accentRing: Record<Accent, string> = {
  1: "border-accent-1 bg-accent-1/15",
  2: "border-accent-2 bg-accent-2/15",
  3: "border-accent-3 bg-accent-3/15",
  4: "border-accent-4 bg-accent-4/15",
};

export const accentDot: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
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
