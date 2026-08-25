import {
  CHOICE_MOVES_AT,
  CONNECT_COMMAND,
  CROPS,
  FURROW,
  HARVEST_3,
  LOBBY_ENTER_AT,
  LOOP_MS,
  PARCEL,
  PLANTED_AT,
  RIPE_2,
  RIPE_3,
  SEGMENTS,
  SPEED,
  START_COINS,
  TYPE_MS,
} from "./arcadeDemo.constants";
import type { DemoCrop, DemoFrame, PlotView, Segment } from "./arcadeDemo.types";

/* ------------------------------------------------------------------ *
 * The whole demo as a pure function of the clock.
 *
 * No reducer, no accumulated state: given an offset into the loop, this
 * returns the exact frame for it. That means the run cannot drift, a tab
 * that was backgrounded for ten minutes resumes mid-scene rather than
 * somewhere impossible, the loop's last frame joins its first cleanly,
 * and reduced-motion is just "evaluate once at a good moment".
 * ------------------------------------------------------------------ */

/** The frame reduced-motion visitors get: the farm, one plot ripe. */
export const STILL_AT = 17_400;

/** Demo milliseconds a crop takes end to end. */
function demoGrowMs(crop: DemoCrop): number {
  return (crop.growSeconds / SPEED) * 1000;
}

/** A plot that comes good at `readyAt`, seen at `t`. */
function ripensAt(crop: DemoCrop, readyAt: number, t: number, selected: boolean): PlotView {
  return sownAt(crop, readyAt - demoGrowMs(crop), t, selected);
}

/** A plot sown at `plantedAt`, seen at `t`. */
function sownAt(crop: DemoCrop, plantedAt: number, t: number, selected: boolean): PlotView {
  const span = demoGrowMs(crop);
  const elapsed = t - plantedAt;
  const progress = Math.max(0, Math.min(1, elapsed / span));
  return {
    crop,
    progress,
    remaining: Math.max(0, (1 - progress) * crop.growSeconds),
    ready: progress >= 1,
    selected,
  };
}

function bare(selected: boolean): PlotView {
  return { crop: null, progress: 0, remaining: 0, ready: false, selected };
}

function segmentAt(t: number): Segment {
  let found = SEGMENTS[0];
  for (const seg of SEGMENTS) {
    if (t >= seg.from) found = seg;
  }
  return found;
}

export function frameAt(raw: number): DemoFrame {
  const t = ((raw % LOOP_MS) + LOOP_MS) % LOOP_MS;
  const segment = segmentAt(t);
  const into = t - segment.from;

  /*
    Plot 1's carrot and plot 3's replacement carrot are both sown so that they
    ripen after the loop ends. A four-minute carrot that came good inside a
    thirty-nine second demo would be a lie about the game's pacing — the point
    of the farm is that it outlasts the session.
  */
  const plots: PlotView[] = [
    ripensAt(CROPS.CARROT, LOOP_MS + 400, t, false),
    ripensAt(CROPS.TURNIP, RIPE_2, t, false),
    t < HARVEST_3
      ? ripensAt(CROPS.TURNIP, RIPE_3, t, true)
      : t < PLANTED_AT
        ? bare(true)
        : sownAt(CROPS.CARROT, PLANTED_AT, t, true),
  ];

  const coins =
    START_COINS +
    (t >= HARVEST_3 ? CROPS.TURNIP.sellValue : 0) -
    (t >= PLANTED_AT ? CROPS.CARROT.seedCost : 0);

  return {
    scene: segment.id,
    title: segment.title,
    strip: segment.strip,
    into,
    typed: segment.id === "connect" ? CONNECT_COMMAND.slice(0, Math.floor(into / TYPE_MS)) : "",
    coins,
    plots,
    modal:
      segment.id === "welcome"
        ? { kind: "welcome" }
        : segment.id === "plant"
          ? { kind: "plant", plot: 2, choice: t >= CHOICE_MOVES_AT ? 1 : 0 }
          : null,
    status: statusAt(t, segment.id),
    headline:
      t < RIPE_2
        ? { icon: "📦", text: PARCEL, highlight: true }
        : { icon: "📰", text: FURROW, highlight: false },
    activeTab: segment.id === "board" ? "7" : segment.id === "farm" ? "1" : null,
    lobbyChoice: 0,
    lobbyEntered: segment.id === "lobby" && t >= LOBBY_ENTER_AT,
  };
}

/** The one-line message the game prints above the keybindings. */
function statusAt(t: number, scene: DemoFrame["scene"]): DemoFrame["status"] {
  if (scene !== "farm" && scene !== "board") return { text: "", tone: "none" };
  if (t >= PLANTED_AT && t < PLANTED_AT + 2600) {
    return { text: `🌱 Carrot planted on plot 3  ·  −${CROPS.CARROT.seedCost} coins`, tone: "good" };
  }
  if (t >= HARVEST_3 && t < RIPE_2) {
    return { text: `✓ Harvested Turnip  ·  +${CROPS.TURNIP.sellValue} coins`, tone: "good" };
  }
  if (t >= RIPE_3) return { text: "🌱 Your Turnip is ready to harvest!", tone: "ready" };
  return { text: "", tone: "none" };
}

/** `154` → `2m 34s`, `28800` → `8h 00m`. The game's own clock formatting. */
export function fmtRemaining(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    return `${h}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
  }
  if (s >= 60) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${s}s`;
}

/** `240` → `4m 00s`. Grow times in the plant menu never round to "now". */
export function fmtGrow(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    return `${h}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
  }
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

/** `900` → `15m`, `28800` → `8h`. For menus with no room for the seconds. */
export function fmtGrowShort(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 60)}m`;
}

/** The ▰▱ bar the game draws under a growing crop. */
export function bar(progress: number, segments: number): { filled: string; empty: string } {
  const f = Math.max(0, Math.min(segments, Math.round(progress * segments)));
  return { filled: "▰".repeat(f), empty: "▱".repeat(segments - f) };
}
