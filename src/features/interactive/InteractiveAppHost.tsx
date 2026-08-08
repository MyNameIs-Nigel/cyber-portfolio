"use client";

import type { ComponentType } from "react";
import { DungeonRpgApp } from "@/features/interactive/dungeon-rpg/DungeonRpgApp";
import { MinesweeperApp } from "@/features/interactive/minesweeper/MinesweeperApp";
import { SubnetCalculatorApp } from "@/features/interactive/subnet-calculator/SubnetCalculatorApp";
import { isLiveInteractiveSlug, type LiveInteractiveSlug } from "@/features/interactive/registry-meta";

const apps = {
  minesweeper: MinesweeperApp,
  "subnet-calculator": SubnetCalculatorApp,
  "dungeon-rpg": DungeonRpgApp,
} satisfies Record<LiveInteractiveSlug, ComponentType>;

export function InteractiveAppHost({ slug }: { slug: string }) {
  if (!isLiveInteractiveSlug(slug)) {
    return null;
  }
  const App = apps[slug];
  return <App />;
}
