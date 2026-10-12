import { AMBIENT_SCENES } from "./ambient.constants";
import type { AmbientSceneId } from "./ambient.types";

export function isAmbientSceneId(value: unknown): value is AmbientSceneId {
  return typeof value === "string" && (AMBIENT_SCENES as readonly string[]).includes(value);
}

/**
 * Chooses this page load's backdrop. A valid `override` wins outright; otherwise it
 * is a uniform pick among the scenes that weren't shown last time, so a reload
 * always changes the view instead of repeating a third of the time.
 */
export function pickScene(
  random: () => number,
  previous: string | null,
  override: string | null = null,
): AmbientSceneId {
  if (isAmbientSceneId(override)) return override;
  const pool = AMBIENT_SCENES.filter((id) => id !== previous);
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}
