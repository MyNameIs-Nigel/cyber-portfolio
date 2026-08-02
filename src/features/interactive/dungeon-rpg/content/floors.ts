/**
 * Per-segment generation and difficulty parameters. Data, not logic — adding a floor here
 * must never require an engine change.
 */
import { FLOOR_COUNT, FOV_RADIUS } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import type { Accent } from "@/types";

export type FloorConfig = {
  floor: number;
  /** The network segment this floor represents. */
  segment: string;
  /** One line of scene-setting shown on arrival. */
  brief: string;
  accent: Accent;
  enemyCount: number;
  /** Added to every enemy's own base level on this floor. */
  levelBonus: number;
  sightRadius: number;
};

export const FLOORS: readonly FloorConfig[] = [
  {
    floor: 1,
    segment: "Perimeter",
    brief: "Edge routing. Noisy, low-skill traffic — whatever got in came through here.",
    accent: 4,
    enemyCount: 4,
    levelBonus: 0,
    sightRadius: FOV_RADIUS,
  },
  {
    floor: 2,
    segment: "DMZ",
    brief: "Public-facing hosts. Something is using them as a staging area.",
    accent: 1,
    enemyCount: 5,
    levelBonus: 1,
    sightRadius: FOV_RADIUS,
  },
  {
    floor: 3,
    segment: "Workstation VLAN",
    brief: "Desktops, printers, and the first real signs of lateral movement.",
    accent: 2,
    enemyCount: 6,
    levelBonus: 3,
    sightRadius: FOV_RADIUS - 1,
  },
  {
    floor: 4,
    segment: "Server VLAN",
    brief: "File shares and databases. The logging here stopped three days ago.",
    accent: 3,
    enemyCount: 7,
    levelBonus: 5,
    sightRadius: FOV_RADIUS - 1,
  },
  {
    floor: 5,
    segment: "Domain Core",
    brief: "Directory services. Whatever has been moving through the estate lives down here.",
    accent: 2,
    enemyCount: 8,
    levelBonus: 7,
    sightRadius: FOV_RADIUS - 2,
  },
] as const;

export function floorConfig(floor: number): FloorConfig {
  const clamped = Math.min(Math.max(floor, 1), FLOOR_COUNT);
  return FLOORS[clamped - 1] ?? FLOORS[0]!;
}

export function isFinalFloor(floor: number): boolean {
  return floor >= FLOOR_COUNT;
}
