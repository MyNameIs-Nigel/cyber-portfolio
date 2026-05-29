import { describe, expect, it } from "vitest";
import { createBaseImage } from "@/features/terminal/baseImage";
import { completeLine } from "@/features/terminal/completion";
import { getCommand } from "@/features/terminal/commandRegistry";
import { HOME } from "@/features/terminal/shell.constants";
import type { ShellState } from "@/features/terminal/shell.types";

describe("completion", () => {
  const state: ShellState = {
    fs: createBaseImage(),
    cwd: HOME,
    oldpwd: HOME,
    vars: new Map(),
    scrollback: [],
    history: [],
  };

  it("completes command names", () => {
    const r = completeLine(state, "he", 2);
    expect(r.value.startsWith("help") || r.options?.includes("help")).toBe(true);
  });

  it("help cmd returns usage (D10)", () => {
    const cmd = getCommand("pwd");
    expect(cmd?.usage).toContain("pwd");
  });
});
