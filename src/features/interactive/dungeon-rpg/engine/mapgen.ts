/**
 * BSP room-and-corridor floor generation. Pure: same `(seed, floor)` → same map, forever,
 * which is why **the map is never saved** — it is recomputed on load.
 *
 * BSP was chosen over cellular automata (organic caves read as a blob at 16px and make door
 * placement awkward) and over drunkard's walk (which needs a retry loop to guarantee
 * connectivity anyway). With BSP the tree structure *is* the connectivity proof: siblings are
 * joined on the way back up, so every room hangs off the same spanning structure.
 */
import {
  MAP_H,
  MAP_W,
  MAX_BSP_DEPTH,
  MAX_GEN_ATTEMPTS,
  MIN_LEAF,
  MIN_ROOM_H,
  MIN_ROOM_W,
  TILE_CODE,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { distanceField, inBounds, isWalkableCode, reachableFrom, tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import { rngFor, type Rng } from "@/features/interactive/dungeon-rpg/engine/rng";
import type { FloorMap, Room, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

type Leaf = {
  x: number;
  y: number;
  w: number;
  h: number;
  left?: Leaf;
  right?: Leaf;
  room?: Room;
};

const ROOM_W_SPREAD = 6;
const ROOM_H_SPREAD = 5;

function blankTiles(): Uint8Array {
  return new Uint8Array(MAP_W * MAP_H).fill(TILE_CODE.wall);
}

function carve(tiles: Uint8Array, x: number, y: number): void {
  // The outermost ring stays solid so the map always has a hard border.
  if (x <= 0 || y <= 0 || x >= MAP_W - 1 || y >= MAP_H - 1) return;
  tiles[tileIndex(x, y)] = TILE_CODE.floor;
}

function splitLeaf(leaf: Leaf, rng: Rng, depth: number): void {
  if (depth >= MAX_BSP_DEPTH) return;

  const canSplitVertically = leaf.w >= MIN_LEAF * 2;
  const canSplitHorizontally = leaf.h >= MIN_LEAF * 2;
  if (!canSplitVertically && !canSplitHorizontally) return;

  let vertical: boolean;
  if (canSplitVertically && canSplitHorizontally) {
    // Cut the longer axis so rooms stay roughly square rather than degenerating into slots.
    if (leaf.w > leaf.h * 1.25) vertical = true;
    else if (leaf.h > leaf.w * 1.25) vertical = false;
    else vertical = rng.chance(0.5);
  } else {
    vertical = canSplitVertically;
  }

  if (vertical) {
    const cut = rng.int(MIN_LEAF, leaf.w - MIN_LEAF);
    leaf.left = { x: leaf.x, y: leaf.y, w: cut, h: leaf.h };
    leaf.right = { x: leaf.x + cut, y: leaf.y, w: leaf.w - cut, h: leaf.h };
  } else {
    const cut = rng.int(MIN_LEAF, leaf.h - MIN_LEAF);
    leaf.left = { x: leaf.x, y: leaf.y, w: leaf.w, h: cut };
    leaf.right = { x: leaf.x, y: leaf.y + cut, w: leaf.w, h: leaf.h - cut };
  }

  splitLeaf(leaf.left, rng, depth + 1);
  splitLeaf(leaf.right, rng, depth + 1);
}

function collectLeaves(leaf: Leaf, out: Leaf[]): void {
  if (!leaf.left || !leaf.right) {
    out.push(leaf);
    return;
  }
  collectLeaves(leaf.left, out);
  collectLeaves(leaf.right, out);
}

/**
 * Rooms are inset at least one tile inside their leaf, so two rooms in neighbouring leaves
 * always have two tiles of wall between them and can never merge into one space.
 */
function carveRooms(leaves: Leaf[], tiles: Uint8Array, rng: Rng): Room[] {
  const rooms: Room[] = [];
  for (const leaf of leaves) {
    const availableW = leaf.w - 2;
    const availableH = leaf.h - 2;
    if (availableW < MIN_ROOM_W || availableH < MIN_ROOM_H) continue;

    const w = rng.int(MIN_ROOM_W, Math.min(availableW, MIN_ROOM_W + ROOM_W_SPREAD));
    const h = rng.int(MIN_ROOM_H, Math.min(availableH, MIN_ROOM_H + ROOM_H_SPREAD));
    const x = leaf.x + 1 + rng.int(0, availableW - w);
    const y = leaf.y + 1 + rng.int(0, availableH - h);

    const room: Room = { id: rooms.length, x, y, w, h };
    leaf.room = room;
    rooms.push(room);

    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) carve(tiles, rx, ry);
    }
  }
  return rooms;
}

function roomCenter(room: Room): Vec2 {
  return { x: room.x + Math.floor(room.w / 2), y: room.y + Math.floor(room.h / 2) };
}

function anyRoom(leaf: Leaf, rng: Rng): Room | undefined {
  if (leaf.room) return leaf.room;
  const options: Room[] = [];
  const leaves: Leaf[] = [];
  collectLeaves(leaf, leaves);
  for (const l of leaves) if (l.room) options.push(l.room);
  if (options.length === 0) return undefined;
  return rng.pick(options);
}

function carveCorridor(tiles: Uint8Array, from: Vec2, to: Vec2, rng: Rng): void {
  const horizontalFirst = rng.chance(0.5);
  const elbow = horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };

  const step = (a: Vec2, b: Vec2) => {
    if (a.x === b.x) {
      const [lo, hi] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
      for (let y = lo; y <= hi; y++) carve(tiles, a.x, y);
    } else {
      const [lo, hi] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
      for (let x = lo; x <= hi; x++) carve(tiles, x, a.y);
    }
  };

  step(from, elbow);
  step(elbow, to);
}

function connectSiblings(leaf: Leaf, tiles: Uint8Array, rng: Rng): void {
  if (!leaf.left || !leaf.right) return;
  connectSiblings(leaf.left, tiles, rng);
  connectSiblings(leaf.right, tiles, rng);

  const a = anyRoom(leaf.left, rng);
  const b = anyRoom(leaf.right, rng);
  if (!a || !b) return;
  carveCorridor(tiles, roomCenter(a), roomCenter(b), rng);
}

/** Anywhere a corridor broke through a room's wall ring becomes a door. */
function placeDoors(tiles: Uint8Array, rooms: Room[]): void {
  for (const room of rooms) {
    const left = room.x - 1;
    const right = room.x + room.w;
    const top = room.y - 1;
    const bottom = room.y + room.h;

    const ring: Vec2[] = [];
    for (let x = left; x <= right; x++) {
      ring.push({ x, y: top }, { x, y: bottom });
    }
    for (let y = room.y; y < room.y + room.h; y++) {
      ring.push({ x: left, y }, { x: right, y });
    }

    for (const { x, y } of ring) {
      if (!inBounds({ w: MAP_W, h: MAP_H }, x, y)) continue;
      if (tiles[tileIndex(x, y)] === TILE_CODE.floor) {
        tiles[tileIndex(x, y)] = TILE_CODE.door;
      }
    }
  }
}

function roomTiles(room: Room): Vec2[] {
  const out: Vec2[] = [];
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) out.push({ x, y });
  }
  return out;
}

function draft(seed: string, floor: number, attempt: number): FloorMap | null {
  const rng = rngFor(seed, "mapgen", floor * 100 + attempt);
  const tiles = blankTiles();

  const root: Leaf = { x: 1, y: 1, w: MAP_W - 2, h: MAP_H - 2 };
  splitLeaf(root, rng, 0);

  const leaves: Leaf[] = [];
  collectLeaves(root, leaves);

  const rooms = carveRooms(leaves, tiles, rng);
  if (rooms.length < 2) return null;

  connectSiblings(root, tiles, rng);
  placeDoors(tiles, rooms);

  const map: FloorMap = {
    floor,
    w: MAP_W,
    h: MAP_H,
    tiles,
    rooms,
    spawn: { x: 0, y: 0 },
    stairs: { x: 0, y: 0 },
  };

  const stairsRoom = rng.pick(rooms);
  const stairs = rng.pick(roomTiles(stairsRoom));
  tiles[tileIndex(stairs.x, stairs.y)] = TILE_CODE.stairs;
  map.stairs = stairs;

  // Spawn goes in the room furthest from the stairs *by corridor*, then at that room's
  // furthest tile — a straight line across a wall is not a walk.
  const fromStairs = distanceField(map, stairs);
  let spawnRoom: Room | null = null;
  let spawnRoomDistance = -1;
  for (const room of rooms) {
    if (room.id === stairsRoom.id) continue;
    const centre = roomCenter(room);
    const d = fromStairs[tileIndex(centre.x, centre.y)]!;
    if (d > spawnRoomDistance) {
      spawnRoomDistance = d;
      spawnRoom = room;
    }
  }
  if (!spawnRoom || spawnRoomDistance < 0) return null;

  let spawn: Vec2 | null = null;
  let spawnDistance = -1;
  for (const tile of roomTiles(spawnRoom)) {
    const d = fromStairs[tileIndex(tile.x, tile.y)]!;
    if (d > spawnDistance) {
      spawnDistance = d;
      spawn = tile;
    }
  }
  if (!spawn || spawnDistance <= 0) return null;
  map.spawn = spawn;

  return validate(map) ? map : null;
}

/**
 * Every walkable tile must be reachable from spawn — the strongest invariant available, and
 * the one that rules out both a sealed staircase and an orphaned corridor stub in one pass.
 */
export function validate(map: FloorMap): boolean {
  if (map.rooms.length < 2) return false;
  if (map.spawn.x === map.stairs.x && map.spawn.y === map.stairs.y) return false;

  for (let x = 0; x < map.w; x++) {
    if (isWalkableCode(map.tiles[tileIndex(x, 0, map.w)]!)) return false;
    if (isWalkableCode(map.tiles[tileIndex(x, map.h - 1, map.w)]!)) return false;
  }
  for (let y = 0; y < map.h; y++) {
    if (isWalkableCode(map.tiles[tileIndex(0, y, map.w)]!)) return false;
    if (isWalkableCode(map.tiles[tileIndex(map.w - 1, y, map.w)]!)) return false;
  }

  const reachable = reachableFrom(map, map.spawn);
  if (!reachable.has(tileIndex(map.stairs.x, map.stairs.y, map.w))) return false;

  let walkable = 0;
  for (let i = 0; i < map.tiles.length; i++) {
    if (isWalkableCode(map.tiles[i]!)) walkable++;
  }
  return reachable.size === walkable;
}

/**
 * A fixed layout used only if generation somehow fails `MAX_GEN_ATTEMPTS` times. It is boring
 * on purpose — a boring floor is infinitely better than a run-ending one. Its own reachability
 * is asserted in the test suite.
 */
export function fallbackFloor(floor: number): FloorMap {
  const tiles = blankTiles();
  const rooms: Room[] = [];
  const columns = [3, 19, 35];
  const rows = [3, 19];

  for (const y of rows) {
    for (const x of columns) {
      const room: Room = { id: rooms.length, x, y, w: 10, h: 9 };
      rooms.push(room);
      for (let ry = y; ry < y + 9; ry++) {
        for (let rx = x; rx < x + 10; rx++) carve(tiles, rx, ry);
      }
    }
  }

  for (const y of rows) {
    const corridorY = y + 4;
    for (let x = columns[0]! + 5; x <= columns[2]! + 5; x++) carve(tiles, x, corridorY);
  }
  const spineX = columns[1]! + 5;
  for (let y = rows[0]! + 4; y <= rows[1]! + 4; y++) carve(tiles, spineX, y);

  placeDoors(tiles, rooms);

  const spawn: Vec2 = { x: columns[0]! + 2, y: rows[0]! + 2 };
  const stairs: Vec2 = { x: columns[2]! + 7, y: rows[1]! + 6 };
  tiles[tileIndex(stairs.x, stairs.y)] = TILE_CODE.stairs;

  return { floor, w: MAP_W, h: MAP_H, tiles, rooms, spawn, stairs };
}

/**
 * Attempt `n` derives its own stream from `floor * 100 + n` rather than mutating one shared
 * stream. If it advanced a cursor instead, a reload would land on a different attempt and the
 * map would change underfoot.
 */
export function generateFloor(seed: string, floor: number): FloorMap {
  for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
    const map = draft(seed, floor, attempt);
    if (map) return map;
  }
  return fallbackFloor(floor);
}
