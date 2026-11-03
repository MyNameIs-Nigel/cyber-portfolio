import { describe, expect, it } from "vitest";
import { layerView, magnify, project, unproject } from "./view";

const W = 1440;
const H = 900;

describe("layerView", () => {
  it("leaves every layer still at the top of the sky", () => {
    const cam = { cx: W / 2, cy: H / 2, zoom: 1 };
    for (const depth of [0.2, 0.5, 1]) expect(layerView(cam, depth, W, H)).toEqual({ scale: 1, tx: 0, ty: 0 });
  });

  it("pans farther layers less than nearer ones as you scroll", () => {
    const cam = { cx: W / 2, cy: 1200 + H / 2, zoom: 1 };
    expect(layerView(cam, 1, W, H).ty).toBe(-1200);
    expect(layerView(cam, 0.25, W, H).ty).toBe(-300);
  });

  it("puts the camera centre in the middle of the screen at any zoom", () => {
    const cam = { cx: 400, cy: 2000, zoom: 2.15 };
    const [x, y] = project(layerView(cam, 1, W, H), 400, 2000);
    expect(x).toBeCloseTo(W / 2);
    expect(y).toBeCloseTo(H / 2);
    expect(layerView(cam, 0.3, W, H).scale).toBeLessThan(layerView(cam, 1, W, H).scale);
  });

  it("inverts cleanly, so the spyglass knows what it is over", () => {
    const view = layerView({ cx: 820, cy: 1400, zoom: 1.6 }, 1, W, H);
    const [x, y] = unproject(view, ...project(view, 312, 977));
    expect(x).toBeCloseTo(312);
    expect(y).toBeCloseTo(977);
  });
});

describe("magnify", () => {
  it("lands the anchor on the lens centre and scales distances around it", () => {
    const view = layerView({ cx: W / 2, cy: 900, zoom: 1 }, 1, W, H);
    const [ax, ay] = project(view, 500, 700);
    const lens = magnify(view, ax, ay, 2, 210, 210);
    expect(project(lens, 500, 700)).toEqual([210, 210]);
    const [x] = project(lens, 510, 700);
    expect(x - 210).toBeCloseTo(20);
  });
});
