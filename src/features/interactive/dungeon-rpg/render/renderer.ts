/**
 * The projector: reads a `GameState` and draws pixels. It decides nothing, writes nothing, and
 * imports no rule. If a change here could alter an outcome, it belongs in `engine/`.
 *
 * Layers, back to front: floor → explored dim → entities → player. Unexplored tiles are simply
 * never drawn, so the background *is* the blackout.
 */
import {
  EXPLORED_DIM_ALPHA,
  TILE_PX,
  VIEW_H,
  VIEW_W,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { floorConfig } from "@/features/interactive/dungeon-rpg/content/floors";
import { tileAt, tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import { getBit } from "@/features/interactive/dungeon-rpg/save/bitset";
import { accentColor, withAlpha, type Palette } from "@/features/interactive/dungeon-rpg/render/palette";
import { createEnemyPortrait, type SpriteSheet } from "@/features/interactive/dungeon-rpg/render/sprites";
import type { Camera, GameState, RunState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export const VIEW_PX_W = VIEW_W * TILE_PX;
export const VIEW_PX_H = VIEW_H * TILE_PX;

const PORTRAIT_PX = 96;

/** Centres on the player and clamps at the map edges so the view never shows past the border. */
export function cameraFor(run: RunState): Camera {
  const maxX = Math.max(0, run.map.w - VIEW_W);
  const maxY = Math.max(0, run.map.h - VIEW_H);
  return {
    x: Math.min(maxX, Math.max(0, run.pos.x - Math.floor(VIEW_W / 2))),
    y: Math.min(maxY, Math.max(0, run.pos.y - Math.floor(VIEW_H / 2))),
  };
}

type DrawContext = {
  ctx: CanvasRenderingContext2D;
  palette: Palette;
  sprites: SpriteSheet | null;
};

/** Uses the sprite when there is one, and a flat rectangle when there isn't. */
function blit(dc: DrawContext, sprite: CanvasImageSource | null, fallback: string, x: number, y: number): void {
  if (sprite) {
    dc.ctx.drawImage(sprite, x, y, TILE_PX, TILE_PX);
    return;
  }
  dc.ctx.fillStyle = fallback;
  dc.ctx.fillRect(x, y, TILE_PX, TILE_PX);
}

function drawExplore(dc: DrawContext, run: RunState, camera: Camera): void {
  const { ctx, palette, sprites } = dc;
  const accent = accentColor(palette, floorConfig(run.floor).accent);

  for (let row = 0; row < VIEW_H; row++) {
    for (let column = 0; column < VIEW_W; column++) {
      const mapX = camera.x + column;
      const mapY = camera.y + row;
      if (mapX < 0 || mapY < 0 || mapX >= run.map.w || mapY >= run.map.h) continue;

      const index = tileIndex(mapX, mapY, run.map.w);
      const explored = getBit(run.explored, index);
      if (!explored) continue;

      const kind = tileAt(run.map, mapX, mapY);
      const px = column * TILE_PX;
      const py = row * TILE_PX;
      blit(dc, sprites?.tiles[kind] ?? null, kind === "wall" ? palette.surface : palette.bg, px, py);

      // Seen-but-not-lit is dimmed rather than hidden: the map you remember stays useful.
      if (!run.visible.has(index)) {
        ctx.fillStyle = withAlpha(palette.bg, EXPLORED_DIM_ALPHA);
        ctx.fillRect(px, py, TILE_PX, TILE_PX);
      }
    }
  }

  // Enemies only render where the player can actually see them.
  for (const enemy of run.enemies) {
    const index = tileIndex(enemy.pos.x, enemy.pos.y, run.map.w);
    if (!run.visible.has(index)) continue;
    const px = (enemy.pos.x - camera.x) * TILE_PX;
    const py = (enemy.pos.y - camera.y) * TILE_PX;
    if (px < 0 || py < 0 || px >= VIEW_PX_W || py >= VIEW_PX_H) continue;
    blit(dc, sprites?.enemy(enemy.defId, accent) ?? null, accent, px, py);
  }

  const playerX = (run.pos.x - camera.x) * TILE_PX;
  const playerY = (run.pos.y - camera.y) * TILE_PX;
  blit(dc, sprites?.player ?? null, palette.accent1, playerX, playerY);
}

function drawBar(dc: DrawContext, x: number, y: number, width: number, ratio: number, color: string): void {
  const { ctx, palette } = dc;
  ctx.fillStyle = withAlpha(palette.border, 0.9);
  ctx.fillRect(x, y, width, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, Math.max(0, Math.round((width - 2) * Math.min(1, Math.max(0, ratio)))), 6);
}

function drawBattle(dc: DrawContext, state: Extract<GameState, { mode: "battle" }>): void {
  const { ctx, palette } = dc;
  const { battle, run } = state;
  const accent = floorConfig(run.floor).accent;
  const accentHex = accentColor(palette, accent);

  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, VIEW_PX_W, VIEW_PX_H);

  // A faint grid, so the battle screen still reads as somewhere inside the network.
  ctx.fillStyle = withAlpha(palette.border, 0.5);
  for (let x = 0; x < VIEW_PX_W; x += TILE_PX) ctx.fillRect(x, 0, 1, VIEW_PX_H);
  for (let y = 0; y < VIEW_PX_H; y += TILE_PX) ctx.fillRect(0, y, VIEW_PX_W, 1);

  const portrait = createEnemyPortrait(battle.enemy.id, palette, accent, PORTRAIT_PX);
  const portraitX = Math.round((VIEW_PX_W - PORTRAIT_PX) / 2);
  const portraitY = Math.round(VIEW_PX_H * 0.22);
  if (portrait) {
    ctx.drawImage(portrait, portraitX, portraitY, PORTRAIT_PX, PORTRAIT_PX);
  } else {
    ctx.fillStyle = accentHex;
    ctx.fillRect(portraitX, portraitY, PORTRAIT_PX, PORTRAIT_PX);
  }

  const barWidth = 160;
  const barX = Math.round((VIEW_PX_W - barWidth) / 2);
  drawBar(dc, barX, portraitY - 18, barWidth, battle.enemy.integrity / battle.enemy.maxIntegrity, accentHex);
  drawBar(
    dc,
    barX,
    VIEW_PX_H - 28,
    barWidth,
    run.player.integrity / run.player.maxIntegrity,
    run.player.integrity / run.player.maxIntegrity < 0.3 ? "#ef4444" : palette.accent1,
  );
}

/**
 * The one drawing entry point. Safe to call with any state — modes without a scene simply
 * clear, which is what the title and death screens want behind their DOM chrome.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera, palette: Palette, sprites: SpriteSheet | null): void {
  const dc: DrawContext = { ctx, palette, sprites };

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, VIEW_PX_W, VIEW_PX_H);

  switch (state.mode) {
    case "explore":
    case "shop":
      drawExplore(dc, state.run, camera);
      break;
    case "battle":
      drawBattle(dc, state);
      break;
    case "dead":
    case "victory":
      // The run's last frame, dimmed, behind the summary panel.
      drawExplore(dc, state.run, camera);
      ctx.fillStyle = withAlpha(palette.bg, 0.7);
      ctx.fillRect(0, 0, VIEW_PX_W, VIEW_PX_H);
      break;
    case "title":
      break;
  }
}

/**
 * Sizes the backing store to an integer multiple of the logical view, so upscaling never
 * lands a source pixel between two device pixels. Returns the scale to draw at.
 */
export function resizeCanvas(canvas: HTMLCanvasElement, devicePixelRatio: number): number {
  const cssWidth = canvas.clientWidth || VIEW_PX_W;
  const scale = Math.max(1, Math.floor((cssWidth * devicePixelRatio) / VIEW_PX_W));
  const width = VIEW_PX_W * scale;
  const height = VIEW_PX_H * scale;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return scale;
}
