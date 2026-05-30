# The Fake Shell

A faithful, browser-only Unix-ish shell embedded on the `/projects` page. Visitors can poke around a
simulated filesystem, create files, pipe and redirect output, and trip over a few easter eggs.
**Nothing is ever executed and nothing ever touches a server** — it is a pure front-end React
feature that makes zero network requests.

> This document describes the shell **as it currently ships**. Planned enhancements (an executable
> `resume.sh`, an Ubuntu-style MOTD, seeded project files, and more) are specified in
> [`.claude/plans/fake-shell-enhancements.md`](../.claude/plans/fake-shell-enhancements.md). Keep this
> doc in sync as those land.

---

## Where it lives

```
src/features/terminal/
  shell.types.ts        FsNode/FsFile/FsDir, ShellState, ParsedLine, CommandResult, CommandDef …
  shell.constants.ts    every safety cap, storage key, FS_SCHEMA_VERSION, HOME/USER/HOSTNAME, BLACKLIST
  baseImage.ts          the canonical read-only "disk image" every visitor boots from
  sanitize.ts           input cleaning: clamp length, strip control/ANSI chars, blacklist, byte counting
  parser.ts             tokenize (quote-aware) → expand vars → split pipeline → extract redirections
  filesystem.ts         PURE tree ops: resolvePath, normalize, mkdir, write, rm, list, permString
  storage.ts            localStorage load/save: versioned base-image + user overlay, quota-safe
  commandRegistry.ts    name → CommandDef; the single source of truth for `help` + completion
  executor.ts           runs a ParsedLine: threads stdin/stdout through pipes, applies redirections
  completion.ts         pure Tab-completion helper (command names + paths)
  commands/             ls, cd, mkdir, touch, rm, cat, echo, clear, pwd, help
  useShell.ts           React hook: ShellState, persistence, runLine(), history, vars, Tab, Ctrl+C/L
  FakeShellApp.tsx      "use client" view — chrome matching Terminal.tsx, scrollback, input, a11y

src/components/projects/
  FakeShellSection.tsx  section wrapper (H2 + intro + mobile-warning modal + <FakeShellApp/>)
```

It is wired into the page in `src/app/projects/page.tsx` via `<FakeShellSection />`.

---

## The core idea: client-side base image + per-visitor overlay

There is **no server state**. A canonical, read-only filesystem (the *base image*) is defined in code
(`baseImage.ts`). Every visitor boots their own private copy of it in the browser. Anything they
create under a writable path is saved as a small *overlay* in `localStorage` and replayed on their
next visit. One visitor never sees another's files; there is nothing to fill, corrupt, or moderate.

This is the single most important property and the direct answer to "the Vercel deployment can't get
crashed": the feature ships no API route, makes no `fetch`, and never reads server env.

### Data flow

```
FakeShellApp (UI)
  └─ useShell (React state + persistence effects)
       └─ runShellLine(state, raw)            executor.ts
            ├─ parseLine(raw, vars)           parser.ts   → ParsedLine | ParseError
            └─ per pipeline segment:
                 ├─ command.run(ctx)          commands/*  → { stdout, stderr, code }
                 │     using pure helpers      filesystem.ts
                 ├─ apply redirection (> / >>) filesystem.ts
                 └─ thread stdout → next stdin
       └─ saveShellFs(state) if mutated       storage.ts
```

The UI only ever renders **plain text** React nodes from `CommandResult` — never HTML, never
`dangerouslySetInnerHTML` — so file contents and names can't inject markup.

---

## The filesystem model

`FsNode` is a discriminated union (`shell.types.ts`):

```ts
type FsFile = { kind: "file"; name: string; content: string; readonly?: boolean; hidden?: boolean; mtime: number };
type FsDir  = { kind: "dir";  name: string; children: Map<string, FsNode>; readonly?: boolean; hidden?: boolean; mtime: number };
```

- **`children` is a `Map`, never a plain object** — this sidesteps prototype-pollution via names like
  `__proto__` (which are also rejected outright by `RESERVED_NAMES`).
- **`readonly`** blocks *writes/creates/deletes*, not traversal — you can `cd` into a read-only dir,
  you just can't modify it. This is what protects the base image and easter eggs.
- **`hidden`** dotfiles only appear with `ls -a`.
- All tree mutations go through `filesystem.ts`, which enforces every safety cap (below) and returns
  bash-shaped `FsError` messages (`Permission denied`, `No space left on device`, …) instead of
  throwing.

`HOME = /home/guest`, `USER = guest`, `HOSTNAME = portfolio`. The prompt renders `~` for `HOME`
(`displayPath`).

### Current base image (`baseImage.ts`)

| Path | Kind | Notes |
|------|------|-------|
| `/` `/home` `/etc` `/usr` `/bin` `/var` | dirs | read-only "system" dirs |
| `/tmp` | dir | writable scratch area |
| `/home/guest` | dir | read-only container for the guest home |
| `/home/guest/README.md` | file (ro) | how-to + the "nothing is real" disclaimer |
| `/home/guest/resume.txt` | file (ro) | pointer to the real résumé |
| `/home/guest/.bashrc` | file (hidden) | flavor |
| `/home/guest/.config` | dir (hidden, ro) | currently empty |
| `/home/guest/.secret/flag.txt` | file (hidden, ro) | easter-egg flag |
| `/etc/motd` | file (ro) | printed as the login banner |
| `/etc/passwd` `/etc/portfolio.conf` | files (ro) | flavor |
| `/etc/secrets.env` | file (hidden, ro) | "you really thought?" egg |

`createBaseImage()` deep-clones a freshly built tree each boot (via `cloneNode`) so nothing is shared
by reference. `BASE_NODE_PATHS` is the stable set of paths the base image owns; `storage.ts` uses it
to re-stamp canonical perms/content on load so a tampered overlay can't unlock read-only nodes.

---

## Parsing & operators (`parser.ts`)

A raw line is processed in a fixed, ReDoS-safe order:

1. **Sanitize** (`sanitize.ts`) — clamp to `MAX_INPUT_LEN`, strip control chars and ANSI escapes.
2. **Assignment detection** — a whole line matching `^(export\s+)?NAME=...$` sets a session variable
   (`applyAssignment`) and produces no command.
3. **Split on `|`** into ≤ `MAX_PIPE_SEGMENTS` segments (empty segment → syntax error).
4. **Tokenize** quote-aware (`'literal'` vs `"$expanded"`, unterminated quote → error).
5. **Expand** `$NAME` / `${NAME}` from the session vars (unknown → empty; not inside single quotes),
   then clamp to `MAX_EXPANDED_LEN`.
6. **Extract one trailing redirection** (`> target` or `>> target`) per segment.

Result is `ParsedLine = ParsedAssignment | ParsedPipeline`, where each `PipelineSegment` is
`{ argv, redirect? }`.

### Operators

| Operator | Meaning |
|----------|---------|
| `>`  | redirect stdout to a file (overwrite) |
| `>>` | redirect stdout to a file (append) |
| `\|` | pipe stdout of one command into stdin of the next |

`executor.ts` runs segments left→right, threading each segment's stdout into the next's stdin. A
redirected segment writes to the file (subject to caps + read-only) and passes an empty string
onward. `stderr` is always shown and never piped. Variable **assignment/expansion** lives in the
parser, not in a command.

---

## Commands (`commands/*`, registered in `commandRegistry.ts`)

Each command is a `CommandDef { name, run, summary, usage }`. `run(ctx)` reads
`{ args, stdin, cwd, state }` and returns `{ stdout, stderr, code }`, mutating the tree only through
`filesystem.ts` helpers. Unknown command → `bash: <cmd>: command not found` (code 127). Error text
mimics GNU coreutils.

| Command | Summary |
|---------|---------|
| `pwd`   | print the working directory |
| `echo`  | print args (`-n` to omit newline); main source for `>`/`>>` |
| `clear` | empty the scrollback (also Ctrl+L) |
| `help`  | list commands; `help <cmd>` prints usage |
| `ls`    | list a dir; `-l` long format, `-a` include dotfiles, combinable (`-la`) |
| `cd`    | change dir; `cd`/`cd ~` → home, `cd -` → previous |
| `mkdir` | create a dir; `-p` makes parents |
| `touch` | create an empty file / bump mtime |
| `cat`   | print files; reads stdin with no args or `-` |
| `rm`    | remove files; `-r` recursive, `-f` force |

`sudo` is currently special-cased in `executor.ts` to print a cheeky refusal. The `help` output also
advertises the operators and a one-line disclaimer (both slated for removal — see the plan).

`ls -l` builds its permission string from `permString(node)` (`dr-xr-xr-x` vs `drwxr-xr-x`,
`-r--r--r--` vs `-rw-r--r--`) and owner `guest`/`root` from the node's `readonly` flag.

---

## Persistence (`storage.ts`)

- **Key:** `STORAGE_KEY = "portfolio-shell-fs:v<FS_SCHEMA_VERSION>"`.
- **Save** persists only the **user overlay** — the writable nodes under `HOME`/`tmp`
  (`{ path, kind, content?, mtime }[]`), never base nodes, never variables.
- **Load** starts from a fresh `createBaseImage()`, applies the overlay into writable locations
  (skipping any path that collides with a base node), then **re-stamps** all base-node
  perms/hidden/content from a canonical clone. Bad JSON / version mismatch / shape failure → discard
  the overlay and boot the clean base image.
- **Version bump = clean slate.** Incrementing `FS_SCHEMA_VERSION` changes the key, so stale
  sandboxes are ignored and everyone reseeds — the intended way to ship base-image changes.
- All writes are wrapped in try/catch; a `QuotaExceededError` surfaces as `No space left on device`
  rather than throwing.

**Session variables are in-memory only** (`ShellState.vars`) and are wiped on refresh — the
deliberate split is: *files persist, variables don't.*

---

## Safety budget (`shell.constants.ts`)

Every limit is enforced in the pure logic layer, so it's unit-testable without a DOM.

| Constant | Default | Guards against |
|---|---|---|
| `MAX_INPUT_LEN` | 2,000 | paste bombs (also `<input maxLength>` + `onPaste` clamp) |
| `MAX_EXPANDED_LEN` | 8,000 | variable-expansion blow-up |
| `MAX_PIPE_SEGMENTS` | 16 | huge pipelines |
| `MAX_ARG_COUNT` | 256 | pathological arg lists |
| `MAX_FILE_BYTES` | 16 KB | one giant file |
| `MAX_TOTAL_BYTES` | 256 KB | whole-FS size (≪ localStorage quota) |
| `MAX_NODES` | 200 | file/dir count explosion |
| `MAX_DEPTH` | 16 | deep nesting / stack blowups |
| `MAX_NAME_LEN` / `MAX_PATH_LEN` | 255 / 1,024 | absurd names/paths |
| `MAX_VARS` / `MAX_VAR_LEN` | 64 / 4 KB | session-variable spam |
| `MAX_SCROLLBACK_LINES` | 1,000 | DOM flooding (ring buffer) |
| `MAX_LINE_RENDER_LEN` | 4,000 | one absurd output line (truncated) |
| `MAX_HISTORY` | 200 | command-history memory |

Byte sizes use `new TextEncoder().encode(s).length` (true UTF-8), so emoji/multibyte can't sneak
past. Other defenses: plain-text rendering (no XSS), `Map`-based children + reserved-name rejection
(no prototype pollution), control/ANSI stripping, linear regexes (no ReDoS), a content/name
`BLACKLIST`, and no `eval`/`Function` anywhere (Vercel `no_eval`).

---

## The view (`FakeShellApp.tsx`)

A `"use client"` component whose chrome mirrors the decorative home-page `Terminal.tsx`
(`rounded-xl border border-border bg-surface`, faux window dots, centered session label, `p-5
font-mono text-sm` body). The scrollback is a `role="log" aria-live="polite"` region; the input is a
seamless transparent `<input>` pinned beneath it. On mount it prints the MOTD. Keyboard: **Enter**
runs, **↑/↓** walk history, **Tab** completes (via `completion.ts`), **Ctrl+L** clears, **Ctrl+C**
abandons the line. Clicking the body focuses the input. `FakeShellSection.tsx` adds the heading,
intro copy, and the mobile-warning modal.

---

## Testing

Vitest, colocated `*.test.ts` next to each module. Because the safety-critical logic is pure, most
tests need no DOM (only `render-safety.test.tsx` uses jsdom). Suites cover `sanitize`, `parser`,
`filesystem`, `executor`, `completion`, `storage`, and render-safety. Run with `npm run test`; gate
changes behind `npm run test`, `npm run lint`, and `npm run build`.

---

## Adding or changing things

- **New command:** add `commands/<name>.ts` exporting a `CommandDef`, register it in
  `commandRegistry.ts`. `help` and Tab completion pick it up automatically. Add a `*.test.ts`.
- **New base-image content:** edit `baseImage.ts` and add the path to `BASE_NODE_PATHS`. Bump
  `FS_SCHEMA_VERSION` if you want existing sandboxes to reseed.
- **New safety cap:** add the constant to `shell.constants.ts` and enforce it in the relevant pure
  module, with a test.
- **Never** introduce a server route, a `fetch`, `eval`/`new Function`, or `dangerouslySetInnerHTML`
  in this feature — those break the safety guarantees the whole design rests on.

---

## Appendix: proposed future commands (not implemented)

Ideas that would deepen the experience and reward exploration, in rough order of bang-for-buck. None
of these are built yet — they're a backlog for whoever picks this up next. Each is implementable
within the existing pure-command model and safety budget.

1. **`grep [-i] PATTERN [file…]`** — filter stdin/file lines by a (sanitized, non-backtracking)
   substring or simple pattern. Pairs perfectly with the seeded `~/projects/*.txt` files
   (`cat ~/projects/*.txt | grep Next.js`) and with pipes generally. The single highest-value
   addition; turns the shell from "look around" into "actually search."

2. **`head [-n N]` / `tail [-n N]`** — print the first/last N lines of stdin or a file (default 10).
   Cheap, pure, and makes longer files (project write-ups, `/var/log/portfolio.log`) pleasant to skim
   without dumping everything.

3. **`whoami` and `uname [-a]`** — `whoami` → `guest`; `uname -a` → a believable
   `Linux portfolio 6.8.0-52-generic … GNU/Linux` line consistent with the MOTD. Tiny, authentic,
   and great as *hidden* discovery commands (not advertised in `help`).

4. **`tree [path]`** — recursive directory view with the classic `├──`/`└──` glyphs, bounded by
   `MAX_DEPTH`/`MAX_NODES`. A genuinely fun way to see the whole sandbox at a glance and show off the
   seeded `projects/` directory. Pure render over the existing tree.

5. **`open <file>` / `xdg-open <url>`** — a portfolio-aware launcher: `open ~/projects/<slug>.txt`
   (or a recognized project slug) routes the browser to that project's case-study page using the same
   relative-`router.push` mechanism the executable `resume.sh` uses. Turns the shell into an
   alternative site navigation surface.

6. **`history`** — print the in-memory command history with line numbers (the data already exists in
   `ShellState.history`). Trivial to add and expected by anyone comfortable in a real shell.

7. **`man <command>`** — a longer-form help pager that reuses each `CommandDef`'s `usage`/`summary`
   plus an optional `description` field. Reinforces the "this is a real environment" illusion better
   than the terse `help <cmd>`.
