import { describe, expect, it } from "vitest";
import { applyAssignment, parseLine, tokenize } from "@/features/terminal/parser";

describe("parser", () => {
  const vars = new Map<string, string>();

  it("tokenizes quotes", () => {
    expect(tokenize(`echo 'a b'`)).toEqual(["echo", "a b"]);
    expect(tokenize(`echo "hi $USER"`)).toEqual(["echo", "hi $USER"]);
  });

  it("rejects unterminated quotes", () => {
    const r = tokenize(`echo 'oops`);
    expect(r).toHaveProperty("message");
  });

  it("expands variables outside single quotes", () => {
    const v = new Map([["USER", "guest"]]);
    const parsed = parseLine('echo "$USER"', v);
    expect(parsed).toMatchObject({ kind: "pipeline" });
    if ("kind" in parsed && parsed.kind === "pipeline") {
      expect(parsed.segments[0]?.argv).toEqual(["echo", "guest"]);
    }
  });

  it("detects assignments", () => {
    const parsed = parseLine("GREETING=howdy", vars);
    expect(parsed).toEqual({ kind: "assignment", name: "GREETING", value: "howdy", exportAlias: false });
  });

  it("splits pipelines and redirections", () => {
    const parsed = parseLine("echo hi | cat", vars);
    if ("kind" in parsed && parsed.kind === "pipeline") {
      expect(parsed.segments).toHaveLength(2);
    }
    const redir = parseLine("echo hi > out.txt", vars);
    if ("kind" in redir && redir.kind === "pipeline") {
      expect(redir.segments[0]?.redirect).toEqual({ mode: ">", target: "out.txt" });
    }
  });

  it("rejects empty pipe segment", () => {
    const r = parseLine("ls |", vars);
    expect(r).toHaveProperty("message");
  });

  it("applies assignment limits", () => {
    const v = new Map<string, string>();
    const err = applyAssignment(v, { kind: "assignment", name: "X", value: "y".repeat(5000), exportAlias: false });
    expect(err).not.toBeNull();
  });
});
