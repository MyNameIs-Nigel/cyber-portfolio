import type { AmbientSceneId, SceneFactory } from "../ambient.types";
import { createFirefliesScene } from "./firefliesScene";
import { createNightScene } from "./nightScene";
import { createStormScene } from "./stormScene";

export const SCENE_FACTORIES: Record<AmbientSceneId, SceneFactory> = {
  storm: createStormScene,
  night: createNightScene,
  fireflies: createFirefliesScene,
};
