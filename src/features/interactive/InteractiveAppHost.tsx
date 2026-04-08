"use client";

import type { ComponentType } from "react";
import { MinesweeperApp } from "@/features/interactive/minesweeper/MinesweeperApp";
import { isLiveInteractiveSlug, type LiveInteractiveSlug } from "@/features/interactive/registry-meta";

const apps = {
  minesweeper: MinesweeperApp,
} satisfies Record<LiveInteractiveSlug, ComponentType>;

export function InteractiveAppHost({ slug }: { slug: string }) {
  if (!isLiveInteractiveSlug(slug)) {
    return null;
  }
  const App = apps[slug];
  return <App />;
}
