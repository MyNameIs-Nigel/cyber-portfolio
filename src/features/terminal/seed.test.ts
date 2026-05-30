import { describe, expect, it } from "vitest";
import { projects } from "@/data/projects";
import { createBaseImage } from "@/features/terminal/baseImage";
import { resolvePath } from "@/features/terminal/filesystem";
import { renderProject, seedProjectFiles } from "@/features/terminal/seed";
import { HOME } from "@/features/terminal/shell.constants";

describe("seed", () => {
  it("renderProject includes title, description, tags, and link", () => {
    const p = projects[0]!;
    const text = renderProject(p);
    expect(text).toContain(p.title);
    expect(text).toContain(p.description);
    expect(text).toContain(p.tags[0]!);
    expect(text).toContain(p.link!);
  });

  it("seedProjectFiles creates writable project txt files", () => {
    const fs = createBaseImage();
    seedProjectFiles(fs);
    for (const p of projects) {
      const res = resolvePath(fs, HOME, `projects/${p.slug}.txt`);
      expect(res.ok).toBe(true);
      if (res.ok && res.node.kind === "file") {
        expect(res.node.readonly).toBeFalsy();
        expect(res.node.executable).toBeFalsy();
        expect(res.node.content).toContain(p.title);
      }
    }
  });
});
