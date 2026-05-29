import { formatMtime, listDirEntries, permString, resolvePath } from "@/features/terminal/filesystem";
import { byteLength } from "@/features/terminal/sanitize";
import type { CommandCtx, CommandDef, FsDir } from "@/features/terminal/shell.types";

function parseFlags(args: string[]): { long: boolean; all: boolean; paths: string[] } | { error: string; code: number } {
  let long = false;
  let all = false;
  const paths: string[] = [];
  for (const arg of args) {
    if (arg.startsWith("-") && arg.length > 1) {
      for (const ch of arg.slice(1)) {
        if (ch === "l") long = true;
        else if (ch === "a") all = true;
        else return { error: `ls: invalid option -- '${ch}'`, code: 2 };
      }
    } else {
      paths.push(arg);
    }
  }
  return { long, all, paths };
}

function formatEntry(node: import("@/features/terminal/shell.types").FsNode, long: boolean, owner: string): string {
  const name = node.kind === "dir" ? `${node.name}/` : node.name;
  if (!long) return name;
  const size = node.kind === "file" ? byteLength(node.content) : 4096;
  const group = owner;
  return `${permString(node)}  ${owner.padEnd(5)} ${group.padEnd(5)} ${String(size).padStart(5)} ${formatMtime(node.mtime)} ${name}`;
}

function listOne(ctx: CommandCtx, target: string, long: boolean, all: boolean): { out: string[]; err: string[]; code: number } {
  const res = resolvePath(ctx.state.fs, ctx.cwd, target);
  if (!res.ok) {
    return { out: [], err: [`ls: cannot access '${target}': No such file or directory`], code: 2 };
  }
  const out: string[] = [];
  if (res.node.kind === "file") {
    out.push(formatEntry(res.node, long, "guest"));
    return { out, err: [], code: 0 };
  }
  const dir = res.node as FsDir;
  const entries = listDirEntries(dir, all);
  if (all) {
    out.push(formatEntry({ kind: "dir", name: ".", children: dir.children, mtime: dir.mtime }, long, "guest"));
    out.push(formatEntry({ kind: "dir", name: "..", children: new Map(), mtime: dir.mtime }, long, "root"));
  }
  for (const e of entries) {
    out.push(formatEntry(e, long, e.readonly ? "root" : "guest"));
  }
  return { out, err: [], code: 0 };
}

export const lsCommand: CommandDef = {
  name: "ls",
  summary: "List directory contents",
  usage: "ls [-la] [paths…]",
  run: (ctx) => {
    const flags = parseFlags(ctx.args);
    if ("error" in flags) {
      return { stdout: "", stderr: `${flags.error}\n`, code: flags.code };
    }
    const paths = flags.paths.length ? flags.paths : ["."];
    const lines: string[] = [];
    const errors: string[] = [];
    let code = 0;
    for (const p of paths) {
      const target = p === "." ? ctx.cwd : p;
      const result = listOne(ctx, target, flags.long, flags.all);
      errors.push(...result.err);
      if (result.err.length) code = 2;
      lines.push(...result.out);
    }
    const stdout = lines.length ? `${lines.join("\n")}\n` : errors.length ? "" : "\n";
    const stderr = errors.length ? `${errors.join("\n")}\n` : "";
    return { stdout, stderr, code };
  },
};
