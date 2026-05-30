import { describe, expect, it } from "vitest";
import { BASE_NODE_PATHS, createBaseImage } from "@/features/terminal/baseImage";
import { resolvePath } from "@/features/terminal/filesystem";
import { HOME } from "@/features/terminal/shell.constants";
import type { FsDir, FsNode } from "@/features/terminal/shell.types";

function isDirEmpty(node: FsNode): boolean {
  return node.kind === "dir" && node.children.size === 0;
}

function walkDirs(root: FsDir, path: string, empty: string[]) {
  for (const [name, child] of root.children) {
    const childPath = path === "/" ? `/${name}` : `${path}/${name}`;
    if (child.kind === "dir") {
      if (isDirEmpty(child) && BASE_NODE_PATHS.has(childPath)) {
        empty.push(childPath);
      }
      walkDirs(child, childPath, empty);
    }
  }
}

describe("baseImage", () => {
  it("has no empty base-owned directories", () => {
    const fs = createBaseImage();
    const empty: string[] = [];
    walkDirs(fs, "/", empty);
    expect(empty).toEqual([]);
  });

  it("removed resume.txt and added executable resume.sh", () => {
    const fs = createBaseImage();
    expect(resolvePath(fs, HOME, "resume.txt").ok).toBe(false);
    const sh = resolvePath(fs, HOME, "resume.sh");
    expect(sh.ok && sh.node.kind === "file").toBe(true);
    if (sh.ok && sh.node.kind === "file") {
      expect(sh.node.executable).toBe(true);
      expect(sh.node.readonly).toBe(true);
      expect(sh.node.content).toContain("curl");
    }
  });

  it("puts disclaimer only in README.txt, not in motd", () => {
    const fs = createBaseImage();
    const disclaimer = "Nothing here is real or executed. Files persist in your browser only.";
    const readme = resolvePath(fs, HOME, "README.txt");
    const motd = resolvePath(fs, "/", "/etc/motd");
    expect(readme.ok && readme.node.kind === "file" && readme.node.content).toContain(disclaimer);
    expect(motd.ok && motd.node.kind === "file" && motd.node.content).not.toContain(disclaimer);
  });
});
