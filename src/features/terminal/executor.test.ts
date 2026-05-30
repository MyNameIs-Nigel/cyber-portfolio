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

  it("handles sudo easter egg via hidden command", () => {
    const s = state();
    const out = runShellLine(s, "sudo rm -rf /");
    expect(out.results[0]?.stderr).toContain("Nice try");
  });

  it("./resume.sh runs script and surfaces navigate", () => {
    const s = state();
    const out = runShellLine(s, "./resume.sh");
    expect(out.results.some((r) => r.stdout.includes("Fetching résumé"))).toBe(true);
    expect(out.navigate).toEqual({ href: "/", delayMs: 1200 });
  });

  it("bare resume.sh is command not found", () => {
    const s = state();
    const out = runShellLine(s, "resume.sh");
    expect(out.results[0]?.stderr).toContain("command not found");
    expect(out.results[0]?.code).toBe(127);
  });

  it("/bin/ls dispatches to ls command", () => {
    const s = state();
    const out = runShellLine(s, "/bin/ls");
    expect(out.results.some((r) => r.stdout.includes("README.txt"))).toBe(true);
  });

  it("non-executable path returns permission denied", () => {
    const s = state();
    const out = runShellLine(s, "./README.txt");
    expect(out.results[0]?.stderr).toContain("Permission denied");
    expect(out.results[0]?.code).toBe(126);
  });

  it("missing path returns no such file", () => {
    const s = state();
    const out = runShellLine(s, "./nope.sh");
    expect(out.results[0]?.stderr).toContain("No such file or directory");
    expect(out.results[0]?.code).toBe(127);
  });

  it("/bin/sh stub returns exec format error", () => {
    const s = state();
    const out = runShellLine(s, "/bin/sh");
    expect(out.results[0]?.stderr).toContain("Exec format error");
    expect(out.results[0]?.code).toBe(126);
  });

  it("propagates navigate through a pipeline (last segment wins)", () => {
    const s = state();
    const out = runShellLine(s, "echo x | ./resume.sh");
    expect(out.navigate).toEqual({ href: "/", delayMs: 1200 });
  });
});
