/**
 * Every player-facing string that isn't a stat. Tone lives here so it can be revised without
 * touching a rule.
 *
 * The theme is fictional throughout: an incident-response descent through a compromised
 * network, described the way a story would describe it. Nothing here documents a real
 * technique, and nothing here should start.
 */
import type { BattleChoice } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export const PLAYER_NAME = "Responder";

export const TITLE = {
  heading: "COLD BOOT",
  subheading: "Incident response, five segments deep.",
  body: [
    "Something is already inside the estate. Work down from the perimeter to the domain core and put it out.",
    "Seeded: the same seed always builds the same network. Share one, or take whatever you're given.",
  ],
} as const;

export const CHOICE_LABEL: Record<BattleChoice, string> = {
  exploit: "EXPLOIT",
  enumerate: "ENUMERATE",
  isolate: "ISOLATE",
  flee: "DISENGAGE",
};

export const CHOICE_HINT: Record<BattleChoice, string> = {
  exploit: "Press the attack.",
  enumerate: "Spend a turn reading it. The next EXPLOIT lands far harder.",
  isolate: "Halve the next hit and patch a little Integrity back.",
  flee: "Break contact. It gets a free swing if you fail.",
};

export const STAT_LABEL = {
  integrity: "Integrity",
  cycles: "Cycles",
  atk: "Pressure",
  def: "Hardening",
  bounty: "Bounty",
  level: "Clearance",
} as const;

export const LOG = {
  runStart: (seed: string) => `Session opened on seed ${seed}. Perimeter is live.`,
  arrive: (segment: string, floor: number) => `Segment ${floor}/5 — ${segment}.`,
  descend: (segment: string) => `Pivoting deeper. Next: ${segment}.`,
  stairsFound: "You reach a pivot point. Press Enter to go deeper.",
  blocked: "Structure blocks the way.",
  encounter: (name: string) => `${name} blocks the path.`,
  playerExploit: (name: string, amount: number) => `EXPLOIT lands on ${name} for ${amount}.`,
  playerCrit: (name: string, amount: number) => `Clean break — ${name} takes ${amount}.`,
  playerEnumerate: (name: string) => `You read ${name}'s behaviour. The next EXPLOIT will bite.`,
  playerIsolate: (amount: number) =>
    amount > 0 ? `Segment isolated. Incoming damage halved; ${amount} Integrity patched.` : "Segment isolated. Incoming damage halved.",
  fleeSuccess: "You break contact and back out of the segment.",
  fleeFail: "It stays on you. No way out this turn.",
  enemyAttack: (name: string, amount: number) => `${name} hits you for ${amount}.`,
  enemyCrit: (name: string, amount: number) => `${name} finds an opening — ${amount} damage.`,
  enemyDefend: (name: string) => `${name} hardens itself.`,
  enemyDefeated: (name: string, xp: number) => `${name} is down. +${xp} XP.`,
  bounty: (amount: number) => `+${amount} Bounty recovered.`,
  levelUp: (level: number) => `Clearance raised to ${level}. Stats improved.`,
  playerDown: "Integrity exhausted. The session drops.",
  victory: "The domain core is clean. Containment complete.",
} as const;

export const DEATH = {
  heading: "SESSION LOST",
  body: "Integrity hit zero. The run is over — but the seed is not a secret.",
} as const;

export const VICTORY = {
  heading: "CONTAINED",
  body: "Five segments cleared to the domain core. The estate is yours again.",
} as const;

export const HELP_LINES: readonly string[] = [
  "Arrow keys or WASD to move.",
  "Walk into something hostile to start a battle.",
  "In a battle: ↑/↓ to choose, Enter to commit.",
  "Enter on a pivot point descends to the next segment.",
] as const;
