/**
 * `localStorage` access for the dungeon RPG.
 *
 * Two independent keys — a run and a permanent profile — so losing one never corrupts the
 * other, and clearing a run on death never touches the profile.
 *
 * **No read path here may throw.** Missing key, unparseable JSON, wrong schema version,
 * hand-edited hostile values, quota errors, or `localStorage` being unavailable entirely
 * (private mode, blocked cookies) all degrade to "start fresh". A broken save on a portfolio
 * site must not be a broken page.
 */
import {
  PROFILE_STORAGE_KEY,
  RUN_STORAGE_KEY,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { emptyProfile, isProfile, isRunSave } from "@/features/interactive/dungeon-rpg/save/schema";
import type { Profile, RunSave, SaveStatus } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

/** Reading the property itself can throw when a browser blocks storage, hence the try. */
function store(): Storage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage | null }).localStorage;
    if (!ls || typeof ls.getItem !== "function") return null;
    return ls;
  } catch {
    return null;
  }
}

/**
 * "Nothing there" and "something unreadable is there" need different handling — the second
 * should be swept out so it can't resurface on every boot — so they're distinct results
 * rather than a shared `null`.
 */
type ReadResult = { status: "empty" } | { status: "ok"; value: unknown } | { status: "corrupt" };

function readJson(key: string): ReadResult {
  const ls = store();
  if (!ls) return { status: "empty" };
  let raw: string | null;
  try {
    raw = ls.getItem(key);
  } catch {
    return { status: "empty" };
  }
  if (!raw) return { status: "empty" };
  try {
    return { status: "ok", value: JSON.parse(raw) as unknown };
  } catch {
    return { status: "corrupt" };
  }
}

function writeJson(key: string, value: unknown): SaveStatus {
  const ls = store();
  if (!ls) return "unavailable";
  try {
    ls.setItem(key, JSON.stringify(value));
    return "ok";
  } catch {
    // Quota, private mode, or a serialisation failure. The game keeps playing in memory.
    return "quota";
  }
}

function removeKey(key: string): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.removeItem(key);
  } catch {
    /* nothing sensible to do; the run is already over */
  }
}

export function loadRun(): RunSave | null {
  const read = readJson(RUN_STORAGE_KEY);
  if (read.status === "ok" && isRunSave(read.value)) return read.value;
  // Junk in the slot would otherwise be re-read on every boot.
  if (read.status !== "empty") removeKey(RUN_STORAGE_KEY);
  return null;
}

export function saveRun(save: RunSave): SaveStatus {
  return writeJson(RUN_STORAGE_KEY, save);
}

/** Ends a run. Deliberately does **not** touch the profile. */
export function clearRun(): void {
  removeKey(RUN_STORAGE_KEY);
}

export function hasRunSave(): boolean {
  return loadRun() !== null;
}

/** Always returns a usable profile — a missing or corrupt one is simply a new one. */
export function loadProfile(): Profile {
  const read = readJson(PROFILE_STORAGE_KEY);
  return read.status === "ok" && isProfile(read.value) ? read.value : emptyProfile();
}

export function saveProfile(profile: Profile): SaveStatus {
  return writeJson(PROFILE_STORAGE_KEY, profile);
}

export function clearProfile(): void {
  removeKey(PROFILE_STORAGE_KEY);
}

/** True when writes can land at all. Used to show a quiet "progress won't be saved" note. */
export function storageAvailable(): boolean {
  return store() !== null;
}
