import { AMBIENT_SCENES, DEFAULT_SCENE } from "./ambient.constants";
import type { AmbientSceneId } from "./ambient.types";

export function isAmbientSceneId(value: unknown): value is AmbientSceneId {
  return typeof value === "string" && (AMBIENT_SCENES as readonly string[]).includes(value);
}

/** The scene for this page load: a valid `?ambient=` value, otherwise the default. */
export function resolveScene(override: string | null): AmbientSceneId {
  return isAmbientSceneId(override) ? override : DEFAULT_SCENE;
}
