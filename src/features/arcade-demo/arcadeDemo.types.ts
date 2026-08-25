/** Types for the self-playing SSH Arcade demo shown in the /projects hero. */

export type SceneId = "connect" | "lobby" | "welcome" | "farm" | "plant" | "board";

export type StatusTone = "none" | "info" | "ready" | "good";

/**
 * One segment of the scripted run. `from` is the offset into the loop at which
 * the segment starts; the next segment's `from` ends it.
 */
export interface Segment {
  from: number;
  id: SceneId;
  /** macOS Terminal window title while this segment is on screen. */
  title: string;
  /** Index into `STRIP` — the caption below the window. Farm segments repeat. */
  strip: number;
}

/** A seed as the plant menu lists it. Numbers are the real game's balance. */
export interface DemoCrop {
  id: string;
  name: string;
  seedCost: number;
  /** Real in-game grow time, in seconds — what the countdown displays. */
  growSeconds: number;
  sellValue: number;
  /** Risky crops salvage to this much, this often. */
  fail?: { to: number; pct: number };
  /** Gated behind earnings/rebirth in the real game; shown with a padlock. */
  locked?: boolean;
}

export interface PlotView {
  /** Null while the plot is bare and waiting to be sown. */
  crop: DemoCrop | null;
  /** 0–1, for the ▰▱ bar. */
  progress: number;
  /** Real game seconds left, already scaled back up from demo time. */
  remaining: number;
  ready: boolean;
  selected: boolean;
}

export interface PlantModal {
  kind: "plant";
  plot: number;
  /** Index into `PLANT_MENU` the arrow is resting on. */
  choice: number;
}

export type Modal = { kind: "welcome" } | PlantModal | null;

/** Everything the view needs, derived purely from a time offset. */
export interface DemoFrame {
  scene: SceneId;
  title: string;
  strip: number;
  /** Milliseconds into the current segment. */
  into: number;
  /** The connect scene types the command one character at a time. */
  typed: string;
  coins: number;
  plots: PlotView[];
  modal: Modal;
  status: { text: string; tone: StatusTone };
  /** Header's second line: the parcel nudge, then the day's headline. */
  headline: { icon: string; text: string; highlight: boolean };
  /** Which nav tab is lit. Null while a modal owns the screen. */
  activeTab: string | null;
  /** Lobby: which cabinet the arrow rests on, and whether ENTER has landed. */
  lobbyChoice: number;
  lobbyEntered: boolean;
}
