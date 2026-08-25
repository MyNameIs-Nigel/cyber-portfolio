import { describe, expect, it } from "vitest";
import {
  expandAliasArgv,
  formatAlias,
  loadAliasesFromFs,
  parseAliasFile,
  setAlias,
} from "@/features/terminal/aliases";
import { createBaseImage } from "@/features/terminal/baseImage";

describe("aliases", () => {
  it("parses alias lines from ~/.bashrc", () => {
    const fs = createBaseImage();
    const aliases = loadAliasesFromFs(fs);
    expect(aliases.get("ll")).toBe("ls -la");
    expect(aliases.get("la")).toBe("ls -A");
    expect(aliases.get("..")).toBe("cd ..");
    expect(aliases.size).toBe(3);
  });

  it("ignores comments, exports, and malformed lines", () => {
    const aliases = parseAliasFile(`# comment
export PS1='x'
alias ll='ls -la'
not an alias
alias bad
alias ok="echo hi"
`);
    expect([...aliases.keys()]).toEqual(["ll", "ok"]);
    expect(aliases.get("ok")).toBe("echo hi");
  });

  it("expands the first word and appends remaining args", () => {
    const aliases = new Map([["ll", "ls -la"]]);
    expect(expandAliasArgv(["ll", "/tmp"], aliases)).toEqual(["ls", "-la", "/tmp"]);
  });

  it("stops recursion when the replacement starts with the same name", () => {
    const aliases = new Map([["ls", "ls -l"]]);
    expect(expandAliasArgv(["ls"], aliases)).toEqual(["ls", "-l"]);
  });

  it("rejects invalid alias names", () => {
    const aliases = new Map<string, string>();
    expect(setAlias(aliases, "has space", "ls")).not.toBeNull();
    expect(setAlias(aliases, "ok", "ls")).toBeNull();
    expect(aliases.get("ok")).toBe("ls");
  });

  it("formats aliases with bash-style quoting", () => {
    expect(formatAlias("ll", "ls -la")).toBe("alias ll='ls -la'");
    expect(formatAlias("q", "it's")).toBe("alias q='it'\\''s'");
  });
});
