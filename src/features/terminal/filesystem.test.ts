import { describe, expect, it } from "vitest";
import { createBaseImage } from "@/features/terminal/baseImage";
import {
  countNodes,
  normalizePath,
  removePath,
  touchFile,
  writeFileContent,
} from "@/features/terminal/filesystem";
import { HOME, MAX_NODES } from "@/features/terminal/shell.constants";

describe("filesystem", () => {
  it("normalizes paths", () => {
    expect(normalizePath(HOME, ".")).toBe(HOME);
    expect(normalizePath(HOME, "..")).toBe("/home");
    expect(normalizePath(HOME, "~/notes")).toBe(`${HOME}/notes`);
  });

  it("blocks prototype pollution names (S9)", () => {
    const fs = createBaseImage();
    expect(touchFile(fs, HOME, "__proto__")).toMatchObject({ message: expect.any(String) });
    expect(fs.children.get("home")?.kind).toBe("dir");
  });

  it("enforces read-only base files", () => {
    const fs = createBaseImage();
    expect(removePath(fs, HOME, "README.md", false, false)).toMatchObject({ message: "Permission denied" });
  });

  it("creates user files under home", () => {
    const fs = createBaseImage();
    expect(touchFile(fs, HOME, "notes.txt")).toBeNull();
    expect(writeFileContent(fs, HOME, "notes.txt", "hello", false)).toBeNull();
  });

  it("respects node caps", () => {
    const fs = createBaseImage();
    let i = 0;
    while (i < MAX_NODES + 5) {
      const err = touchFile(fs, HOME, `f${i}.txt`);
      if (err?.message === "No space left on device") break;
      i++;
    }
    expect(countNodes(fs)).toBeLessThanOrEqual(MAX_NODES + 5);
  });
});
