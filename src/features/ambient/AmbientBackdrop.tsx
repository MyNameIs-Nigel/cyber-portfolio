"use client";

import { useEffect, useRef } from "react";
import { FRAME_INTERVAL_MS, LAST_SCENE_STORAGE_KEY, SCENE_QUERY_PARAM } from "./ambient.constants";
import type { AmbientSceneId, Span, Stage } from "./ambient.types";
import { pickScene } from "./pickScene";
import { SCENE_FACTORIES } from "./scenes";
import { backingScale, computeStage, GUTTER_MASKS } from "./stage";

function chooseScene(): AmbientSceneId {
  const override = new URLSearchParams(window.location.search).get(SCENE_QUERY_PARAM);
  let previous: string | null = null;
  try {
    previous = window.localStorage.getItem(LAST_SCENE_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode, cookie settings): every load is a fresh roll.
  }
  const scene = pickScene(Math.random, previous, override);
  try {
    window.localStorage.setItem(LAST_SCENE_STORAGE_KEY, scene);
  } catch {
    // See above.
  }
  return scene;
}

/**
 * Decorative scene in the side gutters, behind the page. One is picked per page
 * load (client navigations keep it) and drawn onto two canvases, one per gutter,
 * so the content column costs nothing to redraw. Nothing runs on viewports too
 * narrow to have gutters, and with reduced motion it paints one still frame.
 */
export function AmbientBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvases = [leftRef.current, rightRef.current];
    const contexts = canvases.map((c) => c?.getContext("2d") ?? null);
    if (!root || canvases.some((c) => !c) || contexts.some((c) => !c)) return;
    const layers = canvases.map((canvas, i) => ({
      canvas: canvas as HTMLCanvasElement,
      ctx: contexts[i] as CanvasRenderingContext2D,
      view: { x0: 0, x1: 0 } as Span,
    }));

    const id = chooseScene();
    root.dataset.scene = id;
    const scene = SCENE_FACTORIES[id](Math.random);
    for (const { canvas } of layers) canvas.style.backgroundImage = scene.backdrop ?? "";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let stage: Stage | null = null;
    let scale = 1;
    let raf = 0;
    let last = 0;

    const paint = () => {
      if (!stage) return;
      for (const { ctx, view } of layers) {
        // Viewport coordinates in, this gutter's slice out.
        ctx.setTransform(scale, 0, 0, scale, -view.x0 * scale, 0);
        ctx.clearRect(view.x0, 0, view.x1 - view.x0, stage.height);
        scene.draw(ctx, view);
      }
      root.style.opacity = "1";
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const elapsed = now - last;
      if (elapsed < FRAME_INTERVAL_MS - 4) return;
      last = now;
      // Clamp so a backgrounded tab resumes where it left off instead of lurching.
      scene.update(Math.min(elapsed / 1000, 0.1));
      paint();
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const sync = () => {
      stage = computeStage(root.clientWidth, root.clientHeight);
      if (!stage) {
        stop();
        for (const { canvas } of layers) {
          canvas.width = 0;
          canvas.height = 0;
          canvas.style.width = "0px";
        }
        return;
      }
      scale = backingScale(window.devicePixelRatio, stage);
      layers[0].view = { x0: 0, x1: stage.reach };
      layers[1].view = { x0: stage.width - stage.reach, x1: stage.width };
      for (const { canvas } of layers) {
        canvas.width = Math.round(stage.reach * scale);
        canvas.height = Math.round(stage.height * scale);
        canvas.style.width = `${stage.reach}px`;
      }
      scene.resize(stage, scale);

      if (reducedMotion.matches) {
        stop();
        paint();
      } else if (!raf) {
        last = performance.now();
        paint();
        raf = requestAnimationFrame(tick);
      } else {
        paint();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") scene.pointer?.(e.clientX, e.clientY);
    };
    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) scene.pointer?.(null, null);
    };

    sync();
    window.addEventListener("resize", sync);
    reducedMotion.addEventListener("change", sync);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    return () => {
      stop();
      window.removeEventListener("resize", sync);
      reducedMotion.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-0 transition-opacity duration-[2500ms] ease-out"
    >
      <canvas
        ref={leftRef}
        width={0}
        height={0}
        className="absolute left-0 top-0 h-full w-0"
        style={{ maskImage: GUTTER_MASKS.left, WebkitMaskImage: GUTTER_MASKS.left }}
      />
      <canvas
        ref={rightRef}
        width={0}
        height={0}
        className="absolute right-0 top-0 h-full w-0"
        style={{ maskImage: GUTTER_MASKS.right, WebkitMaskImage: GUTTER_MASKS.right }}
      />
    </div>
  );
}
