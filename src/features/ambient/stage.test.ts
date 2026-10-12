import { describe, expect, it } from "vitest";
import { CONTENT_WIDTH, MIN_VIEWPORT_WIDTH, PIXEL_BUDGET } from "./ambient.constants";
import { backingScale, computeStage } from "./stage";

describe("computeStage", () => {
  it("does nothing on viewports without real gutters", () => {
    expect(computeStage(MIN_VIEWPORT_WIDTH - 1, 900)).toBeNull();
    expect(computeStage(390, 844)).toBeNull();
  });

  it("keeps both gutters clear of the content column", () => {
    const stage = computeStage(1920, 1080)!;
    const columnLeft = (1920 - CONTENT_WIDTH) / 2;
    expect(stage.left.x1).toBeLessThan(columnLeft);
    expect(stage.reach).toBeLessThan(columnLeft);
    expect(stage.right.x0).toBeGreaterThan(1920 - columnLeft);
    expect(stage.right.x1 - stage.right.x0).toBe(stage.left.x1 - stage.left.x0);
  });

  it("leaves a usable gutter at the smallest supported width", () => {
    expect(computeStage(MIN_VIEWPORT_WIDTH, 800)!.gutter).toBeGreaterThan(120);
  });

});

describe("backingScale", () => {
  const pixels = (dpr: number, width: number, height: number) => {
    const stage = computeStage(width, height)!;
    return 2 * stage.reach * stage.height * backingScale(dpr, stage) ** 2;
  };

  it("keeps a retina laptop at full sharpness", () => {
    expect(backingScale(2, computeStage(1440, 900)!)).toBe(2);
  });

  it("holds big retina screens to the pixel budget", () => {
    expect(pixels(2, 1920, 1080)).toBeLessThanOrEqual(PIXEL_BUDGET + 1);
    expect(pixels(3, 1680, 1050)).toBeLessThanOrEqual(PIXEL_BUDGET + 1);
  });

  it("never drops below one backing pixel per CSS pixel", () => {
    expect(backingScale(1, computeStage(3840, 2160)!)).toBe(1);
    expect(backingScale(0, computeStage(1440, 900)!)).toBe(1);
  });
});
