/**
 * `GameState` as text.
 *
 * A canvas is invisible to assistive technology, so the same information has to exist in the
 * DOM. Phase 7 grows this into a full mirror; for now it produces the one-line summary that
 * labels the canvas and the short status line beside it.
 */
import { floorConfig } from "@/features/interactive/dungeon-rpg/content/floors";
import { CHOICE_LABEL, STAT_LABEL } from "@/features/interactive/dungeon-rpg/content/flavor";
import { tileAt } from "@/features/interactive/dungeon-rpg/engine/grid";
import type { GameState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export function canvasLabel(state: GameState): string {
  switch (state.mode) {
    case "title":
      return "Title screen. Start a new run or continue a saved one.";

    case "explore":
    case "shop": {
      const { run } = state;
      const segment = floorConfig(run.floor).segment;
      const standingOn = tileAt(run.map, run.pos.x, run.pos.y);
      const visibleEnemies = run.enemies.filter((e) => run.visible.has(e.pos.y * run.map.w + e.pos.x)).length;
      const parts = [
        `Segment ${run.floor} of 5, ${segment}.`,
        `${STAT_LABEL.integrity} ${run.player.integrity} of ${run.player.maxIntegrity}.`,
        // Coordinates so a screen-reader user can build a mental map, not just a mood.
        `Position ${run.pos.x}, ${run.pos.y}.`,
        standingOn === "stairs" ? "Standing on a pivot point." : `Standing on ${standingOn}.`,
        visibleEnemies === 1 ? "One hostile in sight." : `${visibleEnemies || "No"} hostiles in sight.`,
      ];
      return parts.join(" ");
    }

    case "battle": {
      const { battle, run } = state;
      const enemyState = battle.revealed
        ? `${battle.enemy.name}, level ${battle.enemy.level}, ${battle.enemy.integrity} of ${battle.enemy.maxIntegrity} Integrity.`
        : `${battle.enemy.name}, Integrity unknown — ENUMERATE to read it.`;
      return [
        `Battle. ${enemyState}`,
        `Your ${STAT_LABEL.integrity} ${run.player.integrity} of ${run.player.maxIntegrity}.`,
        battle.outcome === "ongoing"
          ? `${battle.turn === "player" ? "Your turn" : "Enemy turn"}. Selected action: ${CHOICE_LABEL[battle.cursor]}.`
          : `Battle over: ${battle.outcome}.`,
      ].join(" ");
    }

    case "dead":
      return `Run over on segment ${state.run.floor}, stopped by ${state.cause}.`;

    case "victory":
      return "Run complete. The domain core is clean.";
  }
}
