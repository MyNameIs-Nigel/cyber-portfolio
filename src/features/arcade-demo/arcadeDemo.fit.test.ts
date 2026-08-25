import { describe, expect, it } from "vitest";
import {
  BOARD_KEYS,
  BOARD_KEYS_COMPACT,
  BOARD_ROWS,
  FARM_KEYS,
  FARM_KEYS_COMPACT,
  LOBBY_CABINETS,
  LOBBY_IDENTITY,
  LOBBY_IDENTITY_COMPACT,
  LOBBY_KEY,
  LOBBY_KEYS,
  NAV,
  NAV_COMPACT,
  PLANT_KEYS,
  PLANT_MENU,
  PLANT_MENU_COMPACT,
} from "@/features/arcade-demo/arcadeDemo.constants";
import { fmtGrow, fmtGrowShort } from "@/features/arcade-demo/arcadeDemo.frame";

/* ------------------------------------------------------------------ *
 * The demo has no scrollbars and no ellipsis to fall back on: the type
 * is sized so a fixed column budget fits the frame, which only holds if
 * every line stays inside the budget. These are those budgets, in
 * character cells, derived from the paddings in ArcadeScreen:
 *
 *   full     102 cols − 3ch outer − 3ch box − borders ≈ 95
 *   compact   60 cols − 2ch outer − 3ch box − borders ≈ 54
 *
 * A copy edit that overflows the window fails here rather than in the
 * hero of the page it is the hero of.
 * ------------------------------------------------------------------ */

const FARM = 95;
const FARM_COMPACT = 54;
/** Inside the cards, which are 72ch and 46ch wide with 3ch / 2ch padding. */
const PLANT_CARD = 66;
const PLANT_CARD_COMPACT = 42;
/** Inside the lobby box: 78ch and 56ch wide, 3ch padding either side. */
const LOBBY = 72;
const LOBBY_COMPACT = 50;

/** Cells a string occupies in a terminal — emoji take two. */
function cols(text: string): number {
  let n = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const wide =
      (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x2600 && cp <= 0x27bf) || cp === 0xfe0f;
    n += wide ? 2 : 1;
  }
  return n;
}

/** The tab strip, with its 2ch gaps and the padding the lit tab adds. */
function navCols(tabs: typeof NAV, chip: string): number {
  const tabsWidth = tabs.reduce(
    (sum, tab) => sum + cols(`${tab.key} ${tab.name}${tab.locked ? " 🔒" : ""}`),
    0,
  );
  const gaps = (tabs.length - 1) * 2;
  /* The lit tab is padded, and the close chip sits a gap away on the right. */
  return tabsWidth + gaps + 1.5 + 2 + cols(chip) + 1.5;
}

describe("arcade demo fits its window", () => {
  it("keeps the farm's keybinding footer inside the frame", () => {
    expect(cols(FARM_KEYS)).toBeLessThanOrEqual(FARM);
    expect(cols(FARM_KEYS_COMPACT)).toBeLessThanOrEqual(FARM_COMPACT);
    expect(cols(BOARD_KEYS)).toBeLessThanOrEqual(FARM);
    expect(cols(BOARD_KEYS_COMPACT)).toBeLessThanOrEqual(FARM_COMPACT);
    expect(cols(PLANT_KEYS)).toBeLessThanOrEqual(FARM_COMPACT);
  });

  it("keeps the tab strip and its close chip inside the frame", () => {
    expect(navCols(NAV, "[x] Close")).toBeLessThanOrEqual(FARM);
    expect(navCols(NAV_COMPACT, "[x]")).toBeLessThanOrEqual(FARM_COMPACT);
  });

  it("keeps the plot row inside the frame", () => {
    /* Three cards, fixed width, with the gap between them. */
    expect(3 * 25 + 2 * 1.5).toBeLessThanOrEqual(FARM);
    expect(3 * 16 + 2 * 1).toBeLessThanOrEqual(FARM_COMPACT);
  });

  it("keeps every seed in the plant menu on one line", () => {
    for (const crop of PLANT_MENU) {
      const line = `${crop.name}  ${crop.seedCost.toLocaleString()}c · ${fmtGrow(crop.growSeconds)} · sells ${crop.sellValue.toLocaleString()}c${
        crop.fail ? ` · fails to ${crop.fail.to}c (${crop.fail.pct}%)` : ""
      }`;
      /* Plus the selection arrow and, where it applies, the padlock. */
      expect(cols(line) + 2 + (crop.locked ? 2 : 0)).toBeLessThanOrEqual(PLANT_CARD);
    }
    for (const crop of PLANT_MENU_COMPACT) {
      const line = `${crop.name} ${crop.seedCost.toLocaleString()}c · ${fmtGrowShort(crop.growSeconds)} · ${crop.sellValue.toLocaleString()}c`;
      expect(cols(line) + 2 + (crop.locked ? 2 : 0)).toBeLessThanOrEqual(PLANT_CARD_COMPACT);
    }
  });

  it("keeps the lobby inside its box", () => {
    for (const cab of LOBBY_CABINETS) {
      expect(cols(`▸ ● ${cab.name} ${cab.tagline}`)).toBeLessThanOrEqual(LOBBY_COMPACT);
      /* The meta line is indented under the cabinet it belongs to. */
      expect(cols(cab.meta) + 6).toBeLessThanOrEqual(LOBBY);
    }
    expect(cols(LOBBY_IDENTITY)).toBeLessThanOrEqual(LOBBY);
    expect(cols(LOBBY_IDENTITY_COMPACT)).toBeLessThanOrEqual(LOBBY_COMPACT);
    expect(cols(LOBBY_KEY)).toBeLessThanOrEqual(LOBBY_COMPACT);
    /* The footer keys sit in the bottom rule, 3ch in from the left corner. */
    expect(cols(LOBBY_KEYS) + 3).toBeLessThanOrEqual(78);
  });

  it("keeps every leaderboard row on one line", () => {
    for (const row of BOARD_ROWS) {
      const left = `▸ #${row.rank}  ${row.name} ·${row.key} ↻ ${row.rebirths}${row.you ? " ← YOU" : ""}`;
      const right = `◆ ${(row.coins ?? 48).toLocaleString()}`;
      expect(cols(left) + 2 + cols(right)).toBeLessThanOrEqual(FARM);
    }
    for (const row of BOARD_ROWS) {
      if (!BOARD_ROWS.slice(0, 5).includes(row)) continue;
      const left = `▸ #${row.rank}  ${row.name} ·${row.key} ↻ ${row.rebirths}${row.you ? " ← YOU" : ""}`;
      const right = `◆ ${(row.coins ?? 48).toLocaleString()}`;
      expect(cols(left) + 2 + cols(right)).toBeLessThanOrEqual(FARM_COMPACT);
    }
  });
});
