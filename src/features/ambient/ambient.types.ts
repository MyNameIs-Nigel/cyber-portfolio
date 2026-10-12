import type { AMBIENT_SCENES } from "./ambient.constants";

export type AmbientSceneId = (typeof AMBIENT_SCENES)[number];

/** A horizontal run of the viewport, in CSS pixels. */
export interface Span {
  x0: number;
  x1: number;
}

/**
 * The drawable layout for one viewport size. `left`/`right` are the fully visible
 * parts of each gutter; `reach` adds the fade band, where particles may still drift
 * but anything important (a window, the moon) would be half-masked.
 */
export interface Stage {
  width: number;
  height: number;
  /** Fully visible width of each gutter, from the viewport edge. */
  gutter: number;
  /** Gutter width including the fade band. */
  reach: number;
  left: Span;
  right: Span;
}

export interface AmbientScene {
  /**
   * Static CSS background behind the scene's canvases (a sky tint, a horizon
   * glow). It is composited once instead of repainted every frame.
   */
  readonly backdrop?: string;
  /** Lays the scene out for a new stage. Called before the first frame and on every resize. */
  resize(stage: Stage, dpr: number): void;
  /** Advances the scene by `dt` seconds. Skipped entirely for a reduced-motion still frame. */
  update(dt: number): void;
  /**
   * Paints the part of the scene inside `view`, in viewport coordinates. Called
   * once per gutter canvas, so anything outside `view` can be skipped.
   */
  draw(ctx: CanvasRenderingContext2D, view: Span): void;
  /** Viewport-space mouse position, or null once it leaves the window. */
  pointer?(x: number | null, y: number | null): void;
}

export type SceneFactory = (random: () => number) => AmbientScene;
