import { formatAlias, isValidAliasName, setAlias } from "@/features/terminal/aliases";
import type { CommandDef } from "@/features/terminal/shell.types";

function parseDefine(arg: string): { name: string; value: string } | null {
  const eq = arg.indexOf("=");
  if (eq <= 0) return null;
  return { name: arg.slice(0, eq), value: arg.slice(eq + 1) };
}

export const aliasCommand: CommandDef = {
  name: "alias",
  summary: "Define or list command aliases",
  usage: "alias [name[=value] …]",
  run: ({ args, state }) => {
    if (args.length === 0) {
      const lines = [...state.aliases.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => formatAlias(name, value));
      const stdout = lines.length ? `${lines.join("\n")}\n` : "";
      return { stdout, stderr: "", code: 0 };
    }

    const out: string[] = [];
    const err: string[] = [];
    let code = 0;

    for (const arg of args) {
      const defined = parseDefine(arg);
      if (defined) {
        const error = setAlias(state.aliases, defined.name, defined.value);
        if (error) {
          err.push(error.message);
          code = 1;
        }
        continue;
      }
      if (!isValidAliasName(arg) || !state.aliases.has(arg)) {
        err.push(`bash: alias: ${arg}: not found`);
        code = 1;
        continue;
      }
      out.push(formatAlias(arg, state.aliases.get(arg)!));
    }

    return {
      stdout: out.length ? `${out.join("\n")}\n` : "",
      stderr: err.length ? `${err.join("\n")}\n` : "",
      code,
    };
  },
};

export const unaliasCommand: CommandDef = {
  name: "unalias",
  summary: "Remove aliases",
  usage: "unalias [-a] name [name …]",
  run: ({ args, state }) => {
    if (!args.length) {
      return { stdout: "", stderr: "unalias: usage: unalias [-a] name [name ...]\n", code: 2 };
    }
    if (args[0] === "-a") {
      state.aliases.clear();
      return { stdout: "", stderr: "", code: 0 };
    }
    const err: string[] = [];
    for (const name of args) {
      if (!state.aliases.has(name)) {
        err.push(`bash: unalias: ${name}: not found`);
        continue;
      }
      state.aliases.delete(name);
    }
    return {
      stdout: "",
      stderr: err.length ? `${err.join("\n")}\n` : "",
      code: err.length ? 1 : 0,
    };
  },
};
