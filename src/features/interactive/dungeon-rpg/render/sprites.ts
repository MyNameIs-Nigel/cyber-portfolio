/**
 * Sprites are **generated, never downloaded.**
 *
 * Every tile and entity is drawn programmatically into an offscreen surface once at boot.
 * There are no image files, no sprite sheet, and no network request — which also sidesteps the
 * `next.config.ts` remote-image allowlist entirely.
 *
 * Texture noise is seeded from a *fixed* constant, never the run seed: the same wall must look
 * the same in every run, or the art starts telling the player something the map doesn't.
 */
import { TILE_PX } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { hashString, makeRng } from "@/features/interactive/dungeon-rpg/engine/rng";
import { accentColor, withAlpha, type Palette } from "@/features/interactive/dungeon-rpg/render/palette";
import type { TileKind } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

/** Fixed forever. Changing it re-textures the whole dungeon. */
const SPRITE_SEED = 0xc0ffee;

export type Surface = { canvas: CanvasImageSource; ctx: CanvasRenderingContext2D };

export type SpriteSheet = {
  tiles: Record<TileKind, CanvasImageSource>;
  player: CanvasImageSource;
  /** Enemy art is derived from the enemy id, so a Rootkit always looks like a Rootkit. */
  enemy(id: string, accent: string): CanvasImageSource;
};

/**
 * Prefers `OffscreenCanvas`, falls back to a detached `<canvas>`, and returns `null` when
 * neither can hand back a 2D context — which is exactly what happens under jsdom. Every
 * caller treats a missing sprite as "draw a flat rectangle instead", so tests still run.
 */
export function createSurface(width: number, height: number): Surface | null {
  try {
    if (typeof OffscreenCanvas === "function") {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
      if (ctx) return { canvas, ctx };
    }
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) return { canvas, ctx };
    }
  } catch {
    /* falls through to null */
  }
  return null;
}

function speckle(ctx: CanvasRenderingContext2D, color: string, count: number, seed: number, alpha: number): void {
  const rng = makeRng(seed);
  ctx.fillStyle = withAlpha(color, alpha);
  for (let i = 0; i < count; i++) {
    ctx.fillRect(rng.int(0, TILE_PX - 1), rng.int(0, TILE_PX - 1), 1, 1);
  }
}

function tileSurface(draw: (ctx: CanvasRenderingContext2D) => void): CanvasImageSource | null {
  const surface = createSurface(TILE_PX, TILE_PX);
  if (!surface) return null;
  draw(surface.ctx);
  return surface.canvas;
}

function drawWall(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);
  // Brick courses, offset on alternate rows.
  ctx.fillStyle = withAlpha(palette.border, 0.9);
  ctx.fillRect(0, 0, TILE_PX, 1);
  ctx.fillRect(0, TILE_PX / 2, TILE_PX, 1);
  ctx.fillRect(TILE_PX / 2, 1, 1, TILE_PX / 2 - 1);
  ctx.fillRect(0, TILE_PX / 2 + 1, 1, TILE_PX / 2 - 1);
  speckle(ctx, palette.fg, 6, SPRITE_SEED, 0.05);
}

function drawFloor(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);
  ctx.fillStyle = withAlpha(palette.border, 0.55);
  ctx.fillRect(0, 0, TILE_PX, 1);
  ctx.fillRect(0, 0, 1, TILE_PX);
  speckle(ctx, palette.muted, 10, SPRITE_SEED + 1, 0.12);
}

function drawDoor(ctx: CanvasRenderingContext2D, palette: Palette): void {
  drawFloor(ctx, palette);
  ctx.fillStyle = withAlpha(palette.accent4, 0.55);
  ctx.fillRect(2, 0, 2, TILE_PX);
  ctx.fillRect(TILE_PX - 4, 0, 2, TILE_PX);
}

function drawStairs(ctx: CanvasRenderingContext2D, palette: Palette): void {
  drawFloor(ctx, palette);
  ctx.fillStyle = palette.accent1;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(2 + i * 3, TILE_PX - 3 - i * 3, TILE_PX - 4 - i * 3, 2);
  }
}

function drawChest(ctx: CanvasRenderingContext2D, palette: Palette): void {
  drawFloor(ctx, palette);
  ctx.fillStyle = palette.accent2;
  ctx.fillRect(3, 6, TILE_PX - 6, TILE_PX - 9);
  ctx.fillStyle = withAlpha(palette.bg, 0.8);
  ctx.fillRect(3, 9, TILE_PX - 6, 1);
}

function drawShop(ctx: CanvasRenderingContext2D, palette: Palette): void {
  drawFloor(ctx, palette);
  ctx.fillStyle = palette.accent3;
  ctx.fillRect(3, 4, TILE_PX - 6, 2);
  ctx.fillRect(4, 6, TILE_PX - 8, TILE_PX - 9);
}

function drawPlayer(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.clearRect(0, 0, TILE_PX, TILE_PX);
  ctx.fillStyle = palette.accent1;
  // A small hooded figure: head, shoulders, and a visor band.
  ctx.fillRect(5, 2, 6, 5);
  ctx.fillRect(4, 7, 8, 6);
  ctx.fillRect(5, 13, 2, 2);
  ctx.fillRect(9, 13, 2, 2);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(6, 4, 4, 2);
  ctx.fillStyle = withAlpha(palette.accent4, 0.9);
  ctx.fillRect(6, 4, 4, 1);
}

/**
 * Enemy silhouettes are derived from a hash of the id, so each one is distinct and stable
 * without anybody hand-drawing eight sprites.
 */
function drawEnemy(ctx: CanvasRenderingContext2D, id: string, accent: string, palette: Palette): void {
  ctx.clearRect(0, 0, TILE_PX, TILE_PX);
  const rng = makeRng(hashString(id) | 0);

  const bodyW = rng.int(7, 11);
  const bodyH = rng.int(7, 11);
  const x = Math.floor((TILE_PX - bodyW) / 2);
  const y = Math.floor((TILE_PX - bodyH) / 2);

  ctx.fillStyle = accent;
  ctx.fillRect(x, y, bodyW, bodyH);

  // Chew a few cells out of the silhouette so no two read the same at a glance.
  ctx.clearRect(x, y, 2, 2);
  ctx.clearRect(x + bodyW - 2, y, 2, 2);
  for (let i = 0; i < 5; i++) {
    ctx.clearRect(x + rng.int(0, bodyW - 1), y + rng.int(0, bodyH - 1), 1, 1);
  }

  ctx.fillStyle = palette.bg;
  const eyeY = y + rng.int(2, Math.max(2, bodyH - 4));
  ctx.fillRect(x + 2, eyeY, 2, 2);
  ctx.fillRect(x + bodyW - 4, eyeY, 2, 2);
}

export function createSprites(palette: Palette): SpriteSheet | null {
  const tiles: Partial<Record<TileKind, CanvasImageSource>> = {
    wall: tileSurface((ctx) => drawWall(ctx, palette)) ?? undefined,
    floor: tileSurface((ctx) => drawFloor(ctx, palette)) ?? undefined,
    door: tileSurface((ctx) => drawDoor(ctx, palette)) ?? undefined,
    stairs: tileSurface((ctx) => drawStairs(ctx, palette)) ?? undefined,
    chest: tileSurface((ctx) => drawChest(ctx, palette)) ?? undefined,
    shop: tileSurface((ctx) => drawShop(ctx, palette)) ?? undefined,
  };
  const player = tileSurface((ctx) => drawPlayer(ctx, palette));
  if (!player || !tiles.wall || !tiles.floor || !tiles.door || !tiles.stairs || !tiles.chest || !tiles.shop) {
    return null;
  }

  const enemyCache = new Map<string, CanvasImageSource>();
  return {
    tiles: tiles as Record<TileKind, CanvasImageSource>,
    player,
    enemy(id, accent) {
      const key = `${id}:${accent}`;
      const cached = enemyCache.get(key);
      if (cached) return cached;
      const made = tileSurface((ctx) => drawEnemy(ctx, id, accent, palette));
      // `player` exists, so a surface is obtainable; this only guards a mid-session failure.
      const sprite = made ?? player;
      enemyCache.set(key, sprite);
      return sprite;
    },
  };
}

/** A larger portrait for the battle screen, drawn on demand from the same silhouette rules. */
export function createEnemyPortrait(id: string, palette: Palette, accent: 1 | 2 | 3 | 4, size: number): CanvasImageSource | null {
  const surface = createSurface(size, size);
  if (!surface) return null;
  const scale = size / TILE_PX;
  surface.ctx.imageSmoothingEnabled = false;
  surface.ctx.scale(scale, scale);
  drawEnemy(surface.ctx, id, accentColor(palette, accent), palette);
  return surface.canvas;
}
