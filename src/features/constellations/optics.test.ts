import { describe, expect, it } from "vitest";
import { focusDistance, opticsFor } from "./optics";

describe("opticsFor", () => {
  it("is heavily defocused, with halation, the moment a constellation is under the lens", () => {
    const o = opticsFor(0, 1);
    expect(o.blur).toBeGreaterThan(6);
    expect(o.halation).toBe(1);
    expect(o.filter).toContain("drop-shadow");
  });

  it("loses blur, halation and fringing steadily as focus is pulled", () => {
    let previous = opticsFor(0, 1);
    for (const f of [0.25, 0.5, 0.75, 0.95]) {
      const o = opticsFor(f, 1);
      expect(o.blur).toBeLessThan(previous.blur);
      expect(o.halation).toBeLessThan(previous.halation);
      expect(o.aberration).toBeLessThan(previous.aberration);
      previous = o;
    }
  });

  it("is pin sharp, with no filters at all, at full focus", () => {
    const o = opticsFor(1, 1);
    expect(o).toMatchObject({ blur: 0, halation: 0, breathing: 1, filter: "none", backgroundFilter: "none" });
  });

  it("stays only slightly soft while sweeping", () => {
    const o = opticsFor(0, 0);
    expect(o.blur).toBeGreaterThan(0);
    expect(o.blur).toBeLessThan(1);
  });
});

describe("focusDistance", () => {
  it("runs from close focus out to infinity", () => {
    expect(focusDistance(0)).toBe("0.5 m");
    expect(focusDistance(1)).toBe("∞");
    expect(parseFloat(focusDistance(0.6))).toBeGreaterThan(1);
  });
});
