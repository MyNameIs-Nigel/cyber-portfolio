import type { InteractiveProject } from "@/types";

export const interactiveProjects: InteractiveProject[] = [
  {
    slug: "retro-tetris",
    title: "Retro Tetris",
    category: "game",
    icon: "/projects/interactive/retro-tetris.svg",
    description: "A retro-styled Tetris experience. Placeholder route — gameplay coming soon.",
    status: "coming-soon",
  },
  {
    slug: "dungeon-rpg",
    title: "Dungeon RPG",
    category: "game",
    icon: "/projects/interactive/dungeon-rpg.svg",
    description: "A small dungeon crawler with EarthBound-inspired vibes. Placeholder route — adventure coming soon.",
    status: "coming-soon",
  },
  {
    slug: "minesweeper",
    title: "Minesweeper",
    category: "game",
    icon: "/projects/interactive/minesweeper.svg",
    description: "Classic Minesweeper in the browser — pick a difficulty, flag mines, and clear the grid.",
    status: "live",
  },
  {
    slug: "subnet-calculator",
    title: "Subnet Calculator",
    category: "tool",
    icon: "/projects/interactive/subnet-calculator.svg",
    description: "Network subnet and CIDR helpers. Placeholder route — calculator UI coming soon.",
    status: "coming-soon",
  },
];

export function getInteractiveProjectBySlug(slug: string): InteractiveProject | undefined {
  return interactiveProjects.find((p) => p.slug === slug);
}
