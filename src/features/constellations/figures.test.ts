import { describe, expect, it } from "vitest";
import { interests } from "@/data/interests";
import { FIGURES, layoutSky } from "./figures";

const ids = interests.map((i) => i.id);

describe("constellation figures", () => {
  it("has a figure for every interest, with every line and ring pointing at a real star", () => {
    for (const id of ids) {
      const figure = FIGURES[id];
      expect(figure, id).toBeDefined();
      for (const [a, b] of figure.lines) {
        expect(figure.stars[a], `${id} line ${a}`).toBeDefined();
        expect(figure.stars[b], `${id} line ${b}`).toBeDefined();
      }
      for (const ring of figure.rings ?? []) expect(figure.stars[ring.star], `${id} ring`).toBeDefined();
    }
  });
});

describe("layoutSky", () => {
  const H = 900;
  const layout = layoutSky(ids, 1440, H, H * 3.4, false);
  const at = (id: string) => layout.constellations.find((c) => c.id === id)!;

  it("staggers the constellations down the sky in reading order", () => {
    const ys = layout.constellations.map((c) => c.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThan(H * 0.5);
  });

  it("zig-zags across: top middle-right, upper left, just left of centre, bottom right", () => {
    const W = layout.width;
    expect(at("photography").x).toBeGreaterThan(W * 0.55);
    expect(at("music").x).toBeLessThan(W * 0.35);
    expect(at("coding").x).toBeGreaterThan(W * 0.35);
    expect(at("coding").x).toBeLessThan(W * 0.5);
    expect(at("cars").x).toBeGreaterThan(W * 0.65);
  });

  it("keeps every star on screen, on a laptop and on a phone", () => {
    for (const [width, height, touch] of [
      [1280, 800, false],
      [390, 844, true],
    ] as const) {
      const sky = layoutSky(ids, width, height, height * 3.4, touch);
      for (const c of sky.constellations) {
        for (const s of c.stars) {
          expect(s.x, `${c.id} at ${width}px`).toBeGreaterThan(0);
          expect(s.x, `${c.id} at ${width}px`).toBeLessThan(width);
        }
      }
    }
  });
});
