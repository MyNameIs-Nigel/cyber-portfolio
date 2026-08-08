/**
 * Enemy definitions. **Data only.**
 *
 * Names and copy are set dressing on ordinary RPG maths. There is no real technique, no real
 * tool behaviour, and nothing here that reads as functional offensive code — this is a security
 * portfolio, and that line is not negotiable. If a new enemy needs an engine change to ship,
 * the content schema is too narrow and *that* is the bug to fix.
 */

export type EnemyDef = {
  id: string;
  name: string;
  /** Base stats at level 1; `scaleEnemy` grows them from here. */
  integrity: number;
  cycles: number;
  atk: number;
  def: number;
  /** 0–1. Higher means it keeps attacking even when badly hurt. */
  aggression: number;
  xp: number;
  bounty: number;
  floors: readonly number[];
  /** Relative likelihood of being picked when several enemies suit a floor. */
  weight: number;
  flavor: { encounter: string; defeat: string; tell: string };
};

export const ENEMIES: readonly EnemyDef[] = [
  {
    id: "cryptominer",
    name: "Cryptominer",
    integrity: 18,
    cycles: 0,
    atk: 5,
    def: 2,
    aggression: 0.75,
    xp: 12,
    bounty: 8,
    floors: [1, 2],
    weight: 10,
    flavor: {
      encounter: "A Cryptominer is pinning the host's fans to maximum.",
      defeat: "The Cryptominer stalls. Fan noise drops to nothing.",
      tell: "It burns itself out as fast as it burns you — trade hits and it loses.",
    },
  },
  {
    id: "phish-bot",
    name: "Phish-Bot",
    integrity: 14,
    cycles: 4,
    atk: 7,
    def: 1,
    aggression: 0.9,
    xp: 14,
    bounty: 10,
    floors: [1, 2, 3],
    weight: 9,
    flavor: {
      encounter: "A Phish-Bot is spraying lookalike prompts across the segment.",
      defeat: "The Phish-Bot's templates collapse into nonsense.",
      tell: "Thin shell, heavy swing. It will not defend, so neither should you.",
    },
  },
  {
    id: "default-creds-wraith",
    name: "Default-Creds Wraith",
    integrity: 22,
    cycles: 6,
    atk: 6,
    def: 4,
    aggression: 0.5,
    xp: 18,
    bounty: 14,
    floors: [2, 3],
    weight: 8,
    flavor: {
      encounter: "A Default-Creds Wraith drifts between hosts that were never re-keyed.",
      defeat: "The Wraith thins out and disperses.",
      tell: "Patient and armoured. ENUMERATE first — brute force here is a losing trade.",
    },
  },
  {
    id: "rootkit",
    name: "Rootkit",
    integrity: 30,
    cycles: 8,
    atk: 9,
    def: 6,
    aggression: 0.45,
    xp: 28,
    bounty: 22,
    floors: [3, 4],
    weight: 7,
    flavor: {
      encounter: "A Rootkit surfaces from below the host's own accounting.",
      defeat: "The Rootkit loses its hiding place and unravels.",
      tell: "It hardens the moment it is hurt. Hit it while it is still confident.",
    },
  },
  {
    id: "beacon",
    name: "Dormant Beacon",
    integrity: 24,
    cycles: 10,
    atk: 8,
    def: 3,
    aggression: 0.65,
    xp: 24,
    bounty: 18,
    floors: [2, 3, 4],
    weight: 8,
    flavor: {
      encounter: "A Dormant Beacon wakes and starts counting.",
      defeat: "The Beacon's timer runs out with nothing on the other end.",
      tell: "Steady, unremarkable, and happy to outlast you.",
    },
  },
  {
    id: "ransomware-daemon",
    name: "Ransomware Daemon",
    integrity: 40,
    cycles: 12,
    atk: 12,
    def: 7,
    aggression: 0.8,
    xp: 44,
    bounty: 40,
    floors: [4, 5],
    weight: 6,
    flavor: {
      encounter: "A Ransomware Daemon is already halfway through the share.",
      defeat: "The Daemon halts mid-pass. The share stops shrinking.",
      tell: "Hits hard and does not slow down. ISOLATE the big swings or don't take them.",
    },
  },
  {
    id: "credential-harvester",
    name: "Credential Harvester",
    integrity: 34,
    cycles: 14,
    atk: 10,
    def: 5,
    aggression: 0.6,
    xp: 38,
    bounty: 32,
    floors: [4, 5],
    weight: 7,
    flavor: {
      encounter: "A Credential Harvester is scraping the segment's session cache.",
      defeat: "The Harvester drops everything it was holding.",
      tell: "Balanced and unhurried. Whatever you are worst at, it will find.",
    },
  },
  {
    id: "domain-shade",
    name: "Domain Shade",
    integrity: 52,
    cycles: 18,
    atk: 14,
    def: 9,
    aggression: 0.7,
    xp: 60,
    bounty: 55,
    floors: [5],
    weight: 5,
    flavor: {
      encounter: "A Domain Shade wearing an administrator's shape turns to face you.",
      defeat: "The Shade loses the shape it was borrowing and goes out.",
      tell: "Everything the estate handed it, it will hand back to you.",
    },
  },
] as const;

export function enemyById(id: string): EnemyDef | undefined {
  return ENEMIES.find((e) => e.id === id);
}

export function enemiesForFloor(floor: number): EnemyDef[] {
  const matches = ENEMIES.filter((e) => e.floors.includes(floor));
  // A floor with no explicit residents falls back to the shallowest roster rather than
  // producing an empty segment.
  return matches.length > 0 ? matches : ENEMIES.filter((e) => e.floors.includes(1));
}
