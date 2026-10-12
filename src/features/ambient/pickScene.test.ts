import { describe, expect, it } from "vitest";
import { AMBIENT_SCENES } from "./ambient.constants";
import { isAmbientSceneId, pickScene } from "./pickScene";

describe("pickScene", () => {
  it("never repeats the previous scene", () => {
    for (const previous of AMBIENT_SCENES) {
      for (let i = 0; i < 20; i++) {
        expect(pickScene(() => i / 20, previous)).not.toBe(previous);
      }
    }
  });

  it("can land on every scene on a first visit", () => {
    const seen = new Set(Array.from({ length: 30 }, (_, i) => pickScene(() => i / 30, null)));
    expect([...seen].sort()).toEqual([...AMBIENT_SCENES].sort());
  });

  it("stays in range when random() returns its upper bound", () => {
    expect(AMBIENT_SCENES).toContain(pickScene(() => 0.9999999999, "storm"));
  });

  it("honours a valid override, even if it was shown last", () => {
    expect(pickScene(() => 0, "night", "night")).toBe("night");
  });

  it("ignores junk overrides and stored values", () => {
    expect(AMBIENT_SCENES).toContain(pickScene(() => 0.5, "<script>", "rm -rf /"));
    expect(isAmbientSceneId("storm")).toBe(true);
    expect(isAmbientSceneId("constructor")).toBe(false);
  });
});
