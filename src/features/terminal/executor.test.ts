import { describe, expect, it } from "vitest";
import { createBaseImage } from "@/features/terminal/baseImage";
import { resolvePath } from "@/features/terminal/filesystem";
import { runShellLine } from "@/features/terminal/executor";
import { HOME } from "@/features/terminal/shell.constants";
import type { ShellState } from "@/features/terminal/shell.types";

function state(): ShellState {
  return {
    fs: createBaseImage(),
    cwd: HOME,
    oldpwd: HOME,
    vars: new Map([["HOME", HOME], ["USER", "guest"]]),
    scrollback: [],
    history: [],
  };
}

describe("executor", () => {
  it("runs pipes and redirections", () => {
    const s = state();
    runShellLine(s, 'echo "line1" > notes.txt');
    runShellLine(s, 'echo "line2" >> notes.txt');
    const out = runShellLine(s, "cat notes.txt | cat");
    expect(out.results.some((r) => r.stdout.includes("line1"))).toBe(true);
    const file = resolvePath(s.fs, HOME, "notes.txt");
    expect(file.ok && file.node.kind === "file" && file.node.content).toContain("line2");
  });

  it("returns command not found (127)", () => {
    const s = state();
    const out = runShellLine(s, "nopecmd");
    expect(out.results[0]?.stderr).toContain("command not found");
    expect(out.results[0]?.code).toBe(127);
  });

  it("handles sudo easter egg", () => {
    const s = state();
    const out = runShellLine(s, "sudo rm -rf /");
    expect(out.results[0]?.stderr).toContain("Nice try");
  });
});
