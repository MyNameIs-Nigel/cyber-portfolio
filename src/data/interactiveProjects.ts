import { isDevEnvironment } from "@/lib/environment";
import type { InteractiveProject } from "@/types";

/**
 * Every interactive entry, including ones hidden from visitors.
 * `published: false` keeps a project here while it's still being built —
 * use `visibleInteractiveProjects` for anything a visitor can reach.
 */
export const interactiveProjects: InteractiveProject[] = [
  {
    slug: "retro-tetris",
    title: "Retro Tetris",
    category: "game",
    icon: "/projects/interactive/retro-tetris.svg",
    description: "A retro-styled Tetris experience. Placeholder route — gameplay coming soon.",
    status: "coming-soon",
    published: false,
  },
  {
    slug: "dungeon-rpg",
    title: "Dungeon RPG",
    category: "game",
    icon: "/projects/interactive/dungeon-rpg.svg",
    description:
      "A seeded, turn-based dungeon crawler themed as an incident-response descent through a compromised network. Fictional flavor only — the maths underneath is ordinary RPG maths.",
    status: "coming-soon",
    published: false,
  },
  {
    slug: "minesweeper",
    title: "Minesweeper",
    category: "game",
    icon: "/projects/interactive/minesweeper.svg",
    description: "Classic Minesweeper in the browser — pick a difficulty, flag mines, and clear the grid.",
    status: "live",
    published: true,
  },
  {
    slug: "subnet-calculator",
    title: "Subnet Calculator",
    category: "tool",
    icon: "/projects/interactive/subnet-calculator.svg",
    description:
      "An IPv4 subnet and CIDR calculator — network and broadcast addresses, usable host ranges, masks, binary breakdowns, and equal-size subnet splits.",
    status: "live",
    published: true,
  },
];

/**
 * Strictly the published entries, regardless of environment. The sitemap uses this because it
 * emits production URLs — a preview build must not advertise pages that 404 on production.
 */
export const publicInteractiveProjects: InteractiveProject[] = interactiveProjects.filter((p) => p.published);

/**
 * What this deployment actually shows: the projects grid and the interactive routes use this.
 * Preview deployments (`ENVIRONMENT=DEV`) show everything so work in progress can be reviewed;
 * production shows only published entries.
 */
export const visibleInteractiveProjects: InteractiveProject[] = isDevEnvironment
  ? interactiveProjects
  : publicInteractiveProjects;

/** Looks up any entry, published or not. Prefer `getVisibleInteractiveProjectBySlug` for routes. */
export function getInteractiveProjectBySlug(slug: string): InteractiveProject | undefined {
  return interactiveProjects.find((p) => p.slug === slug);
}

/** Looks up an entry only if it's published — unpublished slugs resolve to `undefined`. */
export function getPublicInteractiveProjectBySlug(slug: string): InteractiveProject | undefined {
  return publicInteractiveProjects.find((p) => p.slug === slug);
}

/** Looks up an entry only if this deployment shows it — otherwise `undefined`, so routes 404. */
export function getVisibleInteractiveProjectBySlug(slug: string): InteractiveProject | undefined {
  return visibleInteractiveProjects.find((p) => p.slug === slug);
}
