import type { DemoCrop, Segment } from "./arcadeDemo.types";

/* ------------------------------------------------------------------ *
 * The script for the hero demo: one loop of a real visit to
 * play.ssharcade.dev, rebuilt in the DOM rather than recorded.
 *
 * Every number here is either a beat of the run or a value read off the
 * real ssh-farm TUI (seed costs, grow times, sale prices, the wording of
 * the keybinding footer). Nothing about the game is invented, and nothing
 * about the timing is left to chance: the whole frame is a pure function
 * of the offset into the loop, so it starts and ends in the same state.
 * ------------------------------------------------------------------ */

/** Terminal colours, matching the game's lipgloss theme. */
export const TERM = {
  bg: "#141414",
  /* farm */
  frame: "#4c8a4f",
  frameDim: "#2c4a2c",
  text: "#d3e3cb",
  dim: "#7d9276",
  bright: "#8ef06a",
  gold: "#e2c765",
  tabBg: "#3fbf5f",
  tabText: "#0c160c",
  /* lobby */
  cyan: "#5ec8e5",
  cyanDim: "#3d7e91",
  amber: "#e8a33d",
  /* board */
  silver: "#9fc7e8",
  violet: "#b388f5",
} as const;

/** One demo second is six game seconds, so a turnip ripens while you watch. */
export const SPEED = 6;

/** Caption under the window. Farm segments share an entry; the run loops. */
export const STRIP = ["ssh", "lobby", "the farm", "plant", "board"] as const;

const ZSH_TITLE = "ndsmith — -zsh — 120×40";
const LOBBY_TITLE = "ndsmith — SSHARCADE — ssh play.ssharcade.dev — 120×40";
const FARM_TITLE = "ndsmith — ssh-farm 🌾 — ssh play.ssharcade.dev — 120×40";

/** Beats of the loop, in milliseconds from its start. */
export const SEGMENTS: Segment[] = [
  { from: 0, id: "connect", title: ZSH_TITLE, strip: 0 },
  { from: 3400, id: "lobby", title: LOBBY_TITLE, strip: 1 },
  { from: 9400, id: "welcome", title: FARM_TITLE, strip: 2 },
  { from: 13600, id: "farm", title: FARM_TITLE, strip: 2 },
  { from: 22600, id: "plant", title: FARM_TITLE, strip: 3 },
  { from: 27200, id: "farm", title: FARM_TITLE, strip: 2 },
  { from: 32800, id: "board", title: FARM_TITLE, strip: 4 },
];

export const LOOP_MS = 39000;

/** Human-readable length for the caption. Kept beside the loop it describes. */
export const LOOP_LABEL = "~39s";

/* --------------------------------------------------------- the beats */

export const CONNECT_COMMAND = "ssh play.ssharcade.dev";
/** Typing rate, then a beat on the finished line before the screen clears. */
export const TYPE_MS = 85;

/** The arrow drops from Idle Farmer's row to nothing else — it is the pick. */
export const LOBBY_ENTER_AT = 7400;

/** Plot 3's turnip ripens, is harvested, and is re-sown with a carrot. */
export const RIPE_3 = 16200;
export const HARVEST_3 = 20200;
/** Plot 2 comes good just after, and is still standing when the loop ends. */
export const RIPE_2 = 21000;
/** The plant menu's arrow steps down from Turnip to Carrot, then commits. */
export const CHOICE_MOVES_AT = 25200;
export const PLANTED_AT = 27200;

/** Coins at the top of the loop, then the two transactions the run makes. */
export const START_COINS = 48;

/* --------------------------------------------------------- the arcade */

export const LOBBY_CABINETS = [
  {
    name: "IDLE FARMER",
    tagline: "Crops grow while you're away.",
    meta: "idle · prestige · market · leaderboard · v2.2.2 beta",
  },
  {
    name: "MOON MINER",
    tagline: "Drill asteroids, dodge pirates.",
    meta: "extraction · 4 worlds · push-your-luck · v1.6.2 alpha",
  },
  {
    name: "GAMBIT",
    tagline: "Bots or humans. Real clocks.",
    meta: "chess · strategy · multiplayer · v1.0.0 alpha",
  },
];

export const LOBBY_KEY = "key SHA256:1m2IpHFNkBUFgkty…";

/** The line that makes three cabinets one arcade. Trimmed to fit narrow windows. */
export const LOBBY_IDENTITY = "Your key is your account. Same key, same saves, any game.";
export const LOBBY_IDENTITY_COMPACT = "Your key is your account. Same saves, any game.";

/* ----------------------------------------------------------- the farm */

const TURNIP: DemoCrop = { id: "turnip", name: "Turnip", seedCost: 5, growSeconds: 60, sellValue: 9 };
const CARROT: DemoCrop = { id: "carrot", name: "Carrot", seedCost: 14, growSeconds: 240, sellValue: 32 };

export const CROPS = { TURNIP, CARROT } as const;

/**
 * The plant menu, in the order the game lists it. The locked and unaffordable
 * rows stay in: a menu of only the things you can have hides the game's shape.
 */
export const PLANT_MENU: DemoCrop[] = [
  TURNIP,
  CARROT,
  { id: "glimmercorn", name: "Glimmercorn", seedCost: 40, growSeconds: 900, sellValue: 150, fail: { to: 18, pct: 25 }, locked: true },
  { id: "pumpkin", name: "Pumpkin", seedCost: 80, growSeconds: 3600, sellValue: 440 },
  { id: "starfruit", name: "Starfruit", seedCost: 600, growSeconds: 28800, sellValue: 4800, locked: true },
  { id: "moonberry", name: "Moonberry", seedCost: 350, growSeconds: 7200, sellValue: 1300, fail: { to: 162, pct: 30 }, locked: true },
  { id: "emberwheat", name: "Emberwheat", seedCost: 120, growSeconds: 600, sellValue: 190, locked: true },
  { id: "dewmelon", name: "Dewmelon", seedCost: 1200, growSeconds: 43200, sellValue: 10000, locked: true },
];

/** Trimmed for narrow windows: the two you can plant, plus what you're playing for. */
export const PLANT_MENU_COMPACT = PLANT_MENU.slice(0, 5);

export const NAV = [
  { key: "1", name: "Farm" },
  { key: "2", name: "Market" },
  { key: "3", name: "Land" },
  { key: "4", name: "Rebirth" },
  { key: "5", name: "StarShop", locked: true },
  { key: "6", name: "Stats" },
  { key: "7", name: "Board" },
  { key: "?", name: "Help" },
];

/** Narrow windows drop the tabs the demo never visits. */
export const NAV_COMPACT = NAV.filter((t) => ["1", "2", "3", "7", "?"].includes(t.key));

export const MOON = "🌑 New Moon";
export const FURROW = "WEATHER: MILD WITH A CHANCE OF MOONBERRIES";
export const PARCEL = "A parcel waits at the gate — press g";

export const FARM_KEYS =
  "←↑↓→ · enter plant/harvest · a harvest all · r replant all · u upgrades · g gift · q leave";
export const FARM_KEYS_COMPACT = "←↑↓→ · enter plant · a harvest all · q leave";
export const PLANT_KEYS = "↑/↓ choose · enter plant · esc/q close";
export const BOARD_KEYS = "↑/↓/wheel scroll · n rename farm · r refresh · esc back";
export const BOARD_KEYS_COMPACT = "↑/↓ scroll · n rename · esc back";
export const LOBBY_KEYS = "↑↓ SELECT · ENTER PLAY · R REFRESH · ? ABOUT · Q QUIT";

/* ------------------------------------------------------------ the board */

/**
 * The leaderboard as it actually stands — including the two farms several
 * rebirths deep that make the demo's 48 coins look like what they are.
 */
export const BOARD_ROWS = [
  { rank: 1, name: "PARZIVAL", key: "Ugyeo", rebirths: 4, coins: 71335394 },
  { rank: 2, name: "BCHECKETTS", key: "T7mK0", rebirths: 3, coins: 69253961 },
  { rank: 3, name: "EL LLANITO", key: "GHxSE", rebirths: 1, coins: 7905838 },
  { rank: 4, name: "SNOIGEL", key: "Ugyeo", rebirths: 0, coins: 2779 },
  { rank: 5, name: "FARM", key: "ta6WU", rebirths: 0, coins: null, you: true },
  { rank: 6, name: "PTVOOBAF", key: "mvtQk", rebirths: 0, coins: 46 },
  { rank: 7, name: "FARM", key: "fMYds", rebirths: 0, coins: 9 },
];

/** Narrow windows show the podium, you, and nothing that needs scrolling. */
export const BOARD_ROWS_COMPACT = BOARD_ROWS.slice(0, 5);
