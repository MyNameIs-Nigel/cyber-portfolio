import { describe, expect, it } from "vitest";
import { AMBIENT_SCENES, DEFAULT_SCENE } from "./ambient.constants";
import { isAmbientSceneId, resolveScene } from "./resolveScene";

describe("resolveScene", () => {
  it("shows the night sky by default", () => {
    expect(DEFAULT_SCENE).toBe("night");
    expect(resolveScene(null)).toBe("night");
  });

  it.each(AMBIENT_SCENES)("lets ?ambient=%s pin that scene", (id) => {
    expect(resolveScene(id)).toBe(id);
  });

  it("falls back to the default for junk values", () => {
    for (const junk of ["", "Night", "<script>", "constructor", "rm -rf /"]) {
      expect(resolveScene(junk)).toBe(DEFAULT_SCENE);
    }
    expect(isAmbientSceneId("storm")).toBe(true);
    expect(isAmbientSceneId("toString")).toBe(false);
  });
});
