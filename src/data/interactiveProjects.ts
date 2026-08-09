import type { InteractiveProject } from "@/types";

export const interactiveProjects: InteractiveProject[] = [
  {
    slug: "retro-tetris",
    title: "Retro Tetris",
    category: "game",
    icon: "/projects/interactive/retro-tetris.svg",
    description: "Tetris with a deliberately chunky, late-night-arcade look.",
    status: "coming-soon",
  },
  {
    slug: "dungeon-rpg",
    title: "Dungeon RPG",
    category: "game",
    icon: "/projects/interactive/dungeon-rpg.svg",
    description: "A small dungeon crawler inspired by EarthBound.",
    status: "coming-soon",
  },
  {
    slug: "minesweeper",
    title: "Minesweeper",
    category: "game",
    icon: "/projects/interactive/minesweeper.svg",
    description: "Classic Minesweeper with three difficulty levels.",
    status: "live",
  },
  {
    slug: "subnet-calculator",
    title: "Subnet Calculator",
    category: "tool",
    icon: "/projects/interactive/subnet-calculator.svg",
    description: "Quick subnet and CIDR calculations for IPv4 networks.",
    status: "coming-soon",
  },
];

export function getInteractiveProjectBySlug(slug: string): InteractiveProject | undefined {
  return interactiveProjects.find((p) => p.slug === slug);
}
