# Plan: Fake CLI / Browser Shell on the Projects Page

**Status:** Draft / not started — planning pass only, **no code written**
**Author:** Planning pass
**Date:** 2026-05-29
**Target stack:** Next.js 16.2.2 · React 19.2.4 · Tailwind v4 · Vercel (static export of `/projects`)

> ⚠️ Per `AGENTS.md` / `CLAUDE.md`: this is **not** the Next.js you know. Before writing any
> framework code, read the relevant guides in `node_modules/next/dist/docs/` (client components,
> `next/dynamic`, metadata) and heed deprecation notices. Route `params` are Promises; Tailwind v4
> is CSS-first. None of those touch this feature much (it's a self-contained client component),
> but check before assuming an API.

---

## 0. Goal & scope

Build an **interactive, bash-flavored fake shell** embedded directly on the Projects page
(`/projects`), visually identical to the decorative terminal on the home page
(`src/components/Terminal.tsx`). Visitors can poke around a simulated Unix filesystem and
"create files" with real-feeling commands. **Nothing is ever executed and nothing ever touches a
server** — it is a faithful *simulation* that runs entirely in the visitor's browser.

### Commands to implement
`ls` (incl. `ls -l`, `ls -a`, `ls -la`), `cd`, `mkdir`, `touch`, `rm`, `cat`, `echo`, `clear`,
`pwd`, and `help` (auto-generated from the command registry).

### Operators to implement
- `>` — redirect stdout to a file (overwrite)
- `>>` — redirect stdout to a file (append)
- `|` — pipe stdout of one command into stdin of the next

### Extra behaviors requested
- **Session variables**: `NAME=value` assignment + `$NAME` / `${NAME}` expansion. Variables live
  **in memory only** and are wiped on refresh (per the user's explicit "session-side" requirement).
- **Read-only** files & directories, **hidden** (dotfile) files & directories, and **easter eggs**
  — all authored by Nigel in a single base-image module (this plan only seeds a few examples).

### Hard requirement
The deployment **cannot be crashed, filled, or abused into extra cost**, no matter what a visitor
types or pastes. Safety is the primary design driver — see §4 and §8.

### Out of scope (explicitly NOT built)
`&&`, `;`, `&`, subshells, backticks, `$(...)`, command substitution, globbing (`*`/`?`), `sudo`
(stubbed as an easter egg only), `ln`/symlinks, `mv`, `cp`, `grep`, `chmod`, `nano`/editors,
networking of any kind. No `eval`/`Function` on user input ever (Vercel conformance rule
[`no_eval`](https://vercel.com/docs/conformance/rules/no_eval)). No server route, no API, no fetch.

---

## 1. Decisions locked in this planning pass

These were confirmed with the user before writing the plan and are **not** open questions:

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Storage model = client-side, per visitor.** A canonical read-only "base image" is defined in code; each visitor boots their own private sandbox from it. **Zero server writes.** | Only model that makes "can't crash Vercel" *physically* true — there is no server state to fill or corrupt, and one visitor never sees another visitor's content (no moderation surface). |
| D2 | **Filesystem persists on the device via `localStorage`** (survives visits on that browser); re-seeds cleanly on a schema-version bump. | User chose "persist on the device." Bumping `FS_SCHEMA_VERSION` on a deploy effectively wipes stale sandboxes → mirrors the "gone on next production build" behavior the user wanted. |
| D3 | **Session variables are in-memory only**, never persisted. | User's explicit "refreshing your page will get rid of them." Note the deliberate split: **files persist (D2), variables do not.** |
| D4 | Rendered **inline on `/projects`**, between **Other Work** and **Interactive**. Not a routed `/projects/interactive/[slug]` page. | User's placement instruction. |
| D5 | The **`fake-cli-interface` tile is removed** from `src/data/interactiveProjects.ts`. | User's instruction ("remove the fake CLI button in the interactive portion"). |
| D6 | **Test runner = Vitest** (+ `test`/`test:watch` scripts, jsdom only for the render-safety test). | User pick. Native ESM/TS, fits this `"type": "module"` repo. |
| D7 | **Delete** `public/projects/interactive/fake-cli-interface.svg`. | User pick (no longer optional). |
| D8 | **Show the mobile-warning modal** for the shell (reuse `InteractiveMobileWarningModal`). | User pick. |
| D9 | **MOTD banner on startup** whose copy explicitly tells the visitor to `type help for command-list`. | User pick (resolves the startup-copy question). Heading/prompt keep their defaults — section heading TBD by author, prompt `guest@portfolio`. |
| D10 | **`help <cmd>` detail + Tab completion are in scope now** (not deferred). | User pick ("build it now"). |

---

## 2. Current state (what exists today)

- **`src/components/Terminal.tsx`** — *decorative only* terminal: chrome is
  `overflow-hidden rounded-xl border border-border bg-surface`, a centered title bar
  (`border-b border-border py-3 text-center text-sm text-muted`), body `p-5 font-mono text-sm`,
  prompt in `text-accent-1`, and a blinking caret using the `.terminal-cursor` class. **The new
  shell must match this chrome exactly** so it reads as the same UI.
- **`src/app/globals.css`** — defines the theme tokens (`--color-bg/-fg/-muted/-accent-1..4/`
  `-surface/-border`) and the `@keyframes blink` + `.terminal-cursor` animation we will reuse.
- **`src/app/projects/page.tsx`** — server component. Sections in order: Featured Web Applications
  → **Other Work** → `<InteractiveProjectsSection items={interactiveProjects} />`. We insert the
  shell **between Other Work and the Interactive section** (D4).
- **`src/data/interactiveProjects.ts`** — contains a `fake-cli-interface` entry with
  `status: "coming-soon"`. **Delete that entry** (D5). It is *not* in `LIVE_INTERACTIVE_SLUGS`, so
  no registry edits are needed; `generateStaticParams()` will simply stop emitting that route.
  **Delete** `public/projects/interactive/fake-cli-interface.svg` (D7).
- **`src/features/interactive/minesweeper/`** — the established interactive-app layout to mirror:
  `*.types.ts`, `*.constants.ts`, a `useX` hook for logic, and a `*App.tsx` `"use client"` view.
  The shell follows the same shape under a new `src/features/terminal/` directory.
- **Tooling:** ESLint flat config only. **No test runner is configured** — see §15 (we add one).
- **`next.config.ts`** — images restricted to `placehold.co`; irrelevant here (no images).

---

## 3. Why client-side, and why NOT server `/tmp` (grounding)

The user's phrasing ("temp directory on the vercel page") evokes server-side temp storage. That is
the wrong tool and is explicitly rejected, for documented reasons:

- **Vercel functions are stateless & ephemeral.** There is no durable, shared, writable local
  filesystem. The only persistent/shared stores Vercel offers are **external network services** —
  Blob, KV/Redis, Edge Config, Sandbox — confirmed via Vercel docs. `/tmp` exists per-invocation,
  is **not shared across instances**, is wiped on cold start, and is capped per instance. So `/tmp`
  cannot back a "everyone sees the same files" shell *and* would be a disk-fill abuse vector.
- A genuinely **shared** server filesystem would require provisioning **Vercel KV** + per-IP rate
  limiting + global quotas + **content moderation** (one visitor's text shown to all), plus billable
  function/storage usage that an attacker could run up. That is the opposite of "can't crash Vercel."
- The **client-side base-image model** satisfies every functional requirement: everyone "sees all
  the files" because everyone boots the **same** base image; "read-only vs. editable" is a per-node
  flag; "hidden files" are dotfiles; "easter eggs" are just base-image content; and a visitor's own
  creations persist on their device (D2). It consumes **zero** server resources and has **zero**
  cross-user exposure.

> Net: the shell is a pure front-end React feature. It makes **no network requests** and ships
> **no server code**. This is the single most important safety property and the direct answer to
> "the vercel deployment can't get crashed."

---

## 4. Safety budget — hard limits (constants)

All limits live in `shell.constants.ts` and are enforced in the **pure** logic layer (not the UI),
so they are unit-testable (§15). Numbers below are sane defaults; tune during build. Every mutation
path must check the relevant cap and fail with a bash-shaped error (e.g. `No space left on device`)
rather than throwing.

| Constant | Default | Guards against |
|---|---|---|
| `MAX_INPUT_LEN` | 2,000 chars | Paste-bomb into the prompt. Enforced as `<input maxLength>` **and** re-checked in the handler, **and** on `paste`. |
| `MAX_EXPANDED_LEN` | 8,000 chars | Variable-expansion blow-up (`$BIG$BIG$BIG…`). Clamp the post-expansion line before execution. |
| `MAX_PIPE_SEGMENTS` | 16 | Huge pipelines hogging CPU. |
| `MAX_ARG_COUNT` | 256 | Pathological arg lists. |
| `MAX_FILE_BYTES` | 16 KB | One giant file. Checked on every write/append (incl. `>>` accumulation). |
| `MAX_TOTAL_BYTES` | 256 KB | Whole-FS size. **Kept far below the ~5 MB `localStorage` quota** so persistence writes never hit the browser ceiling. |
| `MAX_NODES` | 200 | File/dir count explosion (`touch`/`mkdir` spam). |
| `MAX_DEPTH` | 16 | `mkdir -p a/b/c/…` deep nesting / stack blowups. |
| `MAX_NAME_LEN` | 255 | Absurd single filenames. |
| `MAX_PATH_LEN` | 1,024 | Absurd path strings. |
| `MAX_VARS` | 64 | Session-variable spam. |
| `MAX_VAR_LEN` | 4 KB | One giant variable. |
| `MAX_SCROLLBACK_LINES` | 1,000 | DOM/render flooding. Output is a **ring buffer**; oldest lines dropped. |
| `MAX_LINE_RENDER_LEN` | 4,000 chars | One absurdly long output line. Truncate with `…`. |
| `MAX_HISTORY` | 200 | Command-history memory. |

`byteLength` is measured with `new TextEncoder().encode(s).length` (true UTF-8 size), not
`string.length`, so multibyte/emoji can't sneak past the byte caps.

---

## 5. Architecture overview & file structure

Mirror the minesweeper layout under a new feature folder. **Keep all command logic in pure,
UI-free, deterministic modules** — that is what makes the safety-critical code unit-testable
without React or a DOM.

```
src/features/terminal/
  shell.types.ts        # FsNode/FsFile/FsDir, ShellState, ParsedLine, CommandResult, CommandCtx
  shell.constants.ts    # all §4 limits, BLACKLIST, STORAGE_KEY, FS_SCHEMA_VERSION, HOME, HOSTNAME, USER
  baseImage.ts          # canonical read-only base filesystem (Nigel authors read-only/hidden/eggs here)
  sanitize.ts           # input cleaning: clamp length, strip control/ANSI chars, blacklist check, byte count
  parser.ts             # tokenize (quote-aware) -> expand vars -> split pipeline -> extract redirections
  filesystem.ts         # PURE tree ops: resolvePath, normalize, lookup, mkdir, writeFile, append, rm, list
  storage.ts            # localStorage load/save: versioning, base-image overlay, quota-safe, defensive parse
  commandRegistry.ts    # name -> { run, summary, usage }; the single source of truth for `help`
  executor.ts           # run a ParsedLine: thread stdin/stdout through pipes, apply redirections, mutate FS
  commands/
    ls.ts  cd.ts  mkdir.ts  touch.ts  rm.ts  cat.ts  echo.ts  clear.ts  pwd.ts  help.ts
  useShell.ts           # React hook: holds ShellState, persistence effects, runLine(), history, env vars
  FakeShellApp.tsx      # "use client" view: chrome (matches Terminal.tsx), scrollback, input, keyboard, a11y

src/components/projects/
  FakeShellSection.tsx  # thin section wrapper (H2 + intro + <FakeShellApp/>), imported by /projects

__tests__ (or *.test.ts colocated)   # see §15
```

**Data flow:** `FakeShellApp` (UI) → `useShell` (state + persistence) → `executor.run(parsedLine,
ctx)` → `commands/*` operating on a **pure** in-memory FS via `filesystem.ts`. The UI only ever
renders **plain text** React nodes (never HTML) from `CommandResult`.

### Illustrative types (shape only — not final code)
```ts
// Children are a Map, NOT a plain object — sidesteps prototype-pollution via names like __proto__.
type FsFile = { kind: "file"; name: string; content: string; readonly?: boolean; hidden?: boolean; mtime: number };
type FsDir  = { kind: "dir";  name: string; children: Map<string, FsNode>; readonly?: boolean; hidden?: boolean; mtime: number };
type FsNode = FsFile | FsDir;

type ShellState = {
  fs: FsDir;                 // root "/"
  cwd: string;               // absolute, normalized
  oldpwd: string;
  vars: Map<string, string>; // session vars (in-memory only, D3)
  scrollback: OutputLine[];  // ring buffer, capped (MAX_SCROLLBACK_LINES)
  history: string[];         // capped (MAX_HISTORY)
};

type CommandResult = { stdout: string; stderr: string; code: number };
type CommandCtx = {
  args: string[]; stdin: string; cwd: string; state: ShellState;
  // commands return a result + may request state mutations through fs helpers
};
```

---

## 6. Parser & operators (`parser.ts`)

Process a raw line in this fixed order. Keep every regex **linear / non-backtracking** (no nested
quantifiers) to avoid ReDoS.

1. **Pre-sanitize** (`sanitize.ts`): clamp to `MAX_INPUT_LEN`; strip control chars
   `\x00–\x08,\x0b,\x0c,\x0e–\x1f,\x7f` and ANSI escape sequences (`\x1b[...]`); keep printable +
   `\t`. (Newlines are not possible from a single-line input.)
2. **Variable assignment detection:** if the *entire* line matches `^[A-Za-z_][A-Za-z0-9_]*=...$`
   with no unquoted operator/space before `=`, treat as a `vars` set (respect `MAX_VARS`,
   `MAX_VAR_LEN`) and produce no command. `export NAME=value` accepted as an alias.
3. **Tokenize** quote-aware: support `'single'` (literal) and `"double"` (allows `$var`) quoting;
   a token may concatenate quoted+unquoted runs. Reject/repair unterminated quotes with a
   bash-like `unexpected EOF while looking for matching quote` message.
4. **Variable expansion:** replace `$NAME` / `${NAME}` from `vars` (unknown → empty string), but
   **not** inside single quotes. After expansion, clamp the whole line to `MAX_EXPANDED_LEN`.
5. **Split on `|`** into ≤ `MAX_PIPE_SEGMENTS` segments. Empty segment (e.g. `ls |`) → bash-like
   `syntax error near unexpected token '|'`.
6. **Extract redirection** per segment: at most one trailing `> target` or `>> target`. Multiple
   redirections or a missing target → syntax error. The redirection target is a **path arg**, not a
   command.

Result: `ParsedLine = { kind: "assignment", ... } | { kind: "pipeline", segments: Segment[] }`
where `Segment = { argv: string[]; redirect?: { mode: ">" | ">>"; target: string } }`.

### Operator semantics (`executor.ts`)
- Execute segments left→right. Each segment's **stdin** = previous segment's stdout (first segment
  stdin = `""`).
- If a segment has a redirection, its stdout is **written to the file** (`>` overwrite / `>>`
  append) via `filesystem.ts` (subject to all §4 caps + read-only checks), and an **empty string**
  flows to the next segment. Otherwise stdout flows onward.
- The **final** segment's stdout (if not redirected) is appended to the scrollback. `stderr` from
  any segment is always shown (styled as error) and never piped.
- Writing through a redirection respects **read-only** target/parent (Permission denied) and
  **blacklist** content (rejected) exactly like `touch`/`echo>`.

---

## 7. Command specifications

Shared rules: every command reads `args`/`stdin`/`cwd`, returns `{ stdout, stderr, code }`, and
never mutates `state` except through `filesystem.ts` helpers (which enforce §4). Error text mimics
GNU coreutils so it *feels* real. Unknown command → stderr `bash: <cmd>: command not found`
(code 127). All paths normalized; `~` expands to `HOME` (default `/home/guest`).

### `pwd`
- No args. stdout = absolute normalized `cwd` + `\n`. Always code 0.

### `echo`
- `echo [-n] [args…]` → args joined by single spaces + trailing `\n` (omit newline with `-n`).
- Variables already expanded by the parser. This is the primary content source for `>`/`>>`.
- Output is bounded by `MAX_LINE_RENDER_LEN` on display and by file caps when redirected.

### `clear`
- No FS effect. Empties the **scrollback** (UI state) only. Code 0. (Also bind Ctrl+L to this.)

### `help`
- No args: prints a table built from `commandRegistry` (`name` + one-line `summary`) so it can
  **never drift** from the implemented set, followed by a short "Operators: > >> |" line and a
  one-line disclaimer ("simulated shell — nothing here is real or executed").
- `help <cmd>` (in scope, D10): prints that command's `usage` string from the registry; unknown
  name → `help: no help topics match 'x'`.

### `ls`
- `ls [-l] [-a] [-1] [paths…]`. Flags may be combined (`-la`, `-al`). Unknown flag →
  `ls: invalid option -- 'x'` (code 2).
- No path → list `cwd`. Path to a dir → list its entries; path to a file → echo that path.
- Default: non-hidden entries, names only, sorted (dirs may be tinted via `text-accent-1`,
  matching the home terminal's accent treatment; trailing `/` on dirs).
- `-a`: include dotfiles and synthetic `.` / `..`.
- `-l`: long format — `perms owner group size mtime name`. Perms string derived from node kind +
  `readonly` flag (e.g. dir `dr-xr-xr-x` vs `drwxr-xr-x`; read-only file `-r--r--r--` vs
  `-rw-r--r--`). Owner/group fixed (`guest guest` or `root root` for base nodes). `size` = byte
  length. `mtime` = stored fake/real timestamp formatted like `Mon DD HH:MM`.
- Missing path → `ls: cannot access 'x': No such file or directory` (code 2), but still lists the
  valid paths given alongside it.

### `cd`
- `cd` or `cd ~` → `HOME`. `cd -` → `OLDPWD` (and echo the dir, like bash). `cd ..`, relative, and
  absolute paths supported. Updates `cwd`/`oldpwd` and the `PWD`/`OLDPWD` session vars.
- Target missing → `cd: x: No such file or directory`; target is a file → `cd: x: Not a directory`
  (code 1). No write/permission needed to enter a read-only dir (read-only blocks *writes*, not
  traversal).

### `mkdir`
- `mkdir [-p] dir…`. Creates a directory.
- Without `-p`: existing target → `mkdir: cannot create directory 'x': File exists`; missing parent
  → `…: No such file or directory` (code 1).
- With `-p`: create missing parents, silent if it already exists.
- **Read-only parent** → `mkdir: cannot create directory 'x': Permission denied`.
- Enforces `MAX_NODES`, `MAX_DEPTH`, `MAX_NAME_LEN`, name sanitization + blacklist before creating.
  Cap hit → `mkdir: cannot create directory 'x': No space left on device`.

### `touch`
- `touch file…`. Creates an empty file if absent; if present, bumps `mtime` (no content change).
- **Read-only parent** (or read-only existing file) → `touch: cannot touch 'x': Permission denied`.
- Enforces `MAX_NODES`, `MAX_NAME_LEN`, name sanitization + blacklist. Missing parent dir →
  `touch: cannot touch 'x': No such file or directory`.

### `rm`
- `rm [-r|-R] [-f] target…`.
- File: removed. Directory **without** `-r` → `rm: cannot remove 'x': Is a directory` (code 1).
  With `-r`: recursive (bounded by `MAX_DEPTH`/`MAX_NODES`; tree has no cycles since no symlinks).
- Missing target without `-f` → `rm: cannot remove 'x': No such file or directory`; with `-f`,
  silent success.
- **Read-only nodes are immovable, even with `-f`** → `rm: cannot remove 'x': Permission denied`.
  This is what protects the base image (read-only files/dirs, easter eggs) and the root.
- `rm -rf /` (and any attempt to nuke base/root) recurses but every base node is read-only →
  Permission denied; the base image survives intact. (Optional: print a cheeky one-liner.) Refuse
  to remove `.`/`..`/`cwd` like bash.

### `cat`
- `cat [file…]`. Concatenate file contents to stdout. With **no args** or `-`, read from **stdin**
  (enables `… | cat` and `cat | …` pipe behavior). Multiple files concatenated in order.
- Missing file → `cat: x: No such file or directory`; directory → `cat: x: Is a directory`
  (code 1), continuing with remaining valid files. Output truncated for display per
  `MAX_LINE_RENDER_LEN` / scrollback caps (file content is already capped on write, so this is
  belt-and-suspenders).

### Variable assignment / expansion (parser-level, not a command)
- `NAME=value` sets a session var (respect `MAX_VARS`, `MAX_VAR_LEN`, name pattern). `$NAME` /
  `${NAME}` expand in unquoted/double-quoted args. Unknown var → empty. **In-memory only (D3).**

---

## 8. Safety / abuse-vector analysis → mitigations

This is the core of the plan. Each row is a way a visitor could try to break things and how the
design defeats it. Tests in §15 map back to these IDs.

| ID | Attack / abuse | Mitigation |
|----|----------------|------------|
| S1 | **Crash/flood the Vercel deployment** | Impossible by construction: no server code, no API route, no fetch, no `/tmp`. Pure client feature (D1, §3). |
| S2 | **Paste a trillion characters** into the prompt | `<input maxLength=MAX_INPUT_LEN>` + handler re-clamp + `onPaste` clamp. Reject/trim, never process unbounded input. |
| S3 | **Giant single file** (`echo huge > f`) | `MAX_FILE_BYTES` checked on every write/append (UTF-8 byte length). Over → `No space left on device`. |
| S4 | **Fill the whole FS / localStorage** (many `>>`, many files) | `MAX_TOTAL_BYTES` (≪ 5 MB quota) + `MAX_NODES`, checked before each mutation. `localStorage.setItem` wrapped in try/catch for `QuotaExceededError` regardless. |
| S5 | **Deep nesting** (`mkdir -p a/b/c/…×1000`) | `MAX_DEPTH` + `MAX_PATH_LEN` rejected before creation; recursion in `rm -r`/walks bounded by the same. |
| S6 | **Output flooding** freezing the tab | Scrollback is a **ring buffer** (`MAX_SCROLLBACK_LINES`); per-line truncation (`MAX_LINE_RENDER_LEN`); file caps bound what `cat` can emit. |
| S7 | **XSS / HTML injection** via file content or names | Output is rendered as **plain React text only** — **never** `dangerouslySetInnerHTML`. React auto-escapes. This is the #1 real security concern; assert it in tests (S7 test renders `<img onerror=…>` content and checks it appears as literal text). |
| S8 | **Control-char / ANSI escape injection** (terminal spoofing) | `sanitize.ts` strips control + ESC sequences from all input before parsing/storage. |
| S9 | **Prototype pollution** via names like `__proto__`, `constructor`, `prototype` | FS children stored in a **`Map`**, never a plain object. Additionally reject those reserved names on create. |
| S10 | **Blacklisted words / profanity / slurs** in names or content | `BLACKLIST` (case-insensitive, whitespace/diacritic-normalized) checked on every name + content write; match → reject the write with a friendly stderr ("content blocked"). List kept in `shell.constants.ts` for Nigel to maintain; the plan does not enumerate slurs. |
| S11 | **ReDoS** via crafted input hitting a bad regex | All parser/sanitizer regexes are linear (no nested quantifiers / catastrophic backtracking). Covered by a fuzz-ish test feeding long adversarial strings under a time budget. |
| S12 | **Code execution** via injected input | No `eval`/`new Function`/`setTimeout(string)` anywhere; commands are a static dispatch table. (Vercel `no_eval` rule.) |
| S13 | **Corrupted/tampered `localStorage`** | `storage.ts` parses defensively; on JSON error, schema mismatch, or shape-validation failure → discard and re-seed from base image. Tampering only affects that one browser's own sandbox. |
| S14 | **`localStorage` quota exceeded** on persist | `MAX_TOTAL_BYTES` keeps us well under quota; all writes still wrapped in try/catch → on failure, keep in-memory state and surface `No space left on device`; never throw to the UI. |
| S15 | **Persistently overriding read-only / unlocking easter eggs** by editing storage | On load, base-image nodes (identified by stable path set) are **re-stamped** from code (perms, hidden, canonical content); only the user's *writable overlay* is restored (§12). Read-only integrity is reasserted every boot. |
| S16 | **Variable-expansion bomb** | `MAX_VARS`, `MAX_VAR_LEN`, and post-expansion `MAX_EXPANDED_LEN` clamp before execution. |
| S17 | **Huge pipelines / arg lists** | `MAX_PIPE_SEGMENTS`, `MAX_ARG_COUNT`. |
| S18 | **Reading real secrets** | Base image is 100% fabricated; the client bundle has no server env. Never reference `process.env`, `SELFCHECK_TOKEN`, etc. in this feature. |
| S19 | **SSR/`localStorage` is undefined on server** | All storage access guarded by `typeof window !== "undefined"` and confined to effects/handlers; initial render seeds from base image, hydration reconciles. |
| S20 | **Cross-user content exposure / moderation** | None possible — each visitor only ever sees the base image + their **own** writes (D1). |

---

## 9. Base image (`baseImage.ts`) — read-only, hidden, easter eggs

A single module exports a function returning a fresh deep clone of the canonical root `FsDir`
(fresh clone each boot so nothing is shared by reference). Authoring is trivial via a small literal
helper, e.g. `file(name, content, { readonly, hidden })` and `dir(name, children, { readonly })`.

Conventions / suggested seed (Nigel expands the eggs/content):
- `HOME = /home/guest`, `USER = guest`, `HOSTNAME = portfolio` (matches the home terminal's
  `nigel@portfolio` style). Prompt shows `~` for HOME.
- **Writable** (user's playground): `/home/guest` and anything they create under it (and `/tmp`).
- **Read-only system dirs** (look real, block writes): `/`, `/home`, `/etc`, `/usr`, `/bin`, `/var`.
- **Read-only files (examples):** `/etc/motd` — printed as the **startup banner (D9)**; its copy
  must explicitly tell the visitor to `type help for command-list` (plus a short "simulated shell"
  line and any flavor Nigel wants). `/etc/passwd` (funny
  fake entries), `/etc/portfolio.conf`, `/home/guest/README.md` (how-to + "type `help`"),
  `/home/guest/resume.txt` (pointer to the real resume/contact).
- **Hidden (dotfiles):** `/home/guest/.bashrc`, `/home/guest/.config/…`, and a hidden egg dir
  `/home/guest/.secret/` containing e.g. `flag.txt`.
- **Easter eggs (placeholders for Nigel):** `sudo` → stderr "Nice try. This incident will be
  reported. 🙂" (no FS effect); a `.secret/flag.txt`; ASCII-art file; a `secrets.env` that just
  says "you really thought?". These are pure base-image content + the `sudo` stub.

`baseImage.ts` also exports the **stable set of base-node paths** used by `storage.ts` (§12, S15)
to re-stamp canonical perms/content on load.

---

## 10. Persistence design (`storage.ts`) — base image + user overlay

Goal: persist the visitor's own creations across visits (D2) while keeping the base image canonical
and tamper-resistant (S13, S15), and never exceeding quota (S4, S14).

- **Key:** `STORAGE_KEY = "portfolio-shell-fs:v<FS_SCHEMA_VERSION>"`. On boot, read this key.
- **Save format:** persist only the **user overlay** — a compact list of writable nodes the visitor
  created/edited under writable paths (`{ path, kind, content?, mtime }[]`), **not** the whole tree
  and **never** base nodes. (Variables are excluded entirely — D3.) Serialize Map→array.
- **Load:**
  1. Start from a fresh `baseImage()` clone.
  2. If a stored overlay exists and its version matches: validate shape; replay each overlay entry
     into writable locations, **skipping** any path colliding with a base/read-only node (S15).
     Re-stamp all base-node perms/hidden/content from code.
  3. On any parse error / version mismatch / validation failure → ignore overlay, use pure base
     image, and overwrite the bad key (S13).
- **Version bump = clean slate:** incrementing `FS_SCHEMA_VERSION` (done on a deploy that changes
  the base image) means old keys are ignored → mirrors "wiped on next production build" (D2).
- **Quota:** writes wrapped in try/catch (S14); `MAX_TOTAL_BYTES` keeps us well under the browser
  ceiling so this is a backstop, not the primary control.
- **Debounce** persistence (e.g., save on idle / after each successful mutating command) to avoid
  thrashing `localStorage`.

---

## 11. UI / view spec (`FakeShellApp.tsx`, `"use client"`)

Match `Terminal.tsx` chrome so it reads as the same component family:

- **Outer:** `overflow-hidden rounded-xl border border-border bg-surface`.
- **Title bar:** `border-b border-border py-3 text-center text-sm text-muted`, text like
  `guest@portfolio: ~` (reflect cwd; show `~` for HOME). Optionally a left-aligned trio of
  faux window dots for flavor.
- **Body:** `p-5 font-mono text-sm`. A fixed-height scroll region (e.g. `h-[420px] overflow-y-auto`,
  responsive) containing the **scrollback** rendered with `whitespace-pre-wrap break-words`:
  prompt segments in `text-accent-1`, normal output in `text-fg`, errors in `text-red-400`/accent-2.
- **Input line:** mirrors the home terminal — `text-accent-1` prompt + a seamless
  `bg-transparent outline-none w-full` `<input>` in `font-mono text-fg`. Either use the native caret
  or a custom blinking block via the existing `.terminal-cursor` class with `caret-transparent` to
  exactly match the home look. Clicking anywhere in the body focuses the input.
- **On mount:** print the `/etc/motd` banner (D9), which explicitly instructs
  `type help for command-list`.
- **Auto-scroll** to bottom on new output.

### Keyboard
- **Enter** runs the line (echo `prompt + line` into scrollback first, like a real shell).
- **↑/↓** walk command history (capped `MAX_HISTORY`).
- **Tab** path/command completion (in scope, D10): completes the command name in the first token,
  otherwise completes a path against the current FS; common-prefix completion, list on ambiguity.
- **Ctrl+L** clear; **Ctrl+C** abandon the current line (echo `^C`, new prompt).

### Accessibility & perf
- Scrollback container `role="log" aria-live="polite"`; input has an accessible label.
- Keyboard-reachable; respects focus-visible ring conventions used elsewhere.
- Consider `next/dynamic` (client-only) lazy import so the shell isn't in the initial `/projects`
  bundle (optional perf; read the Next 16 `next/dynamic` guide first). A plain client component is
  acceptable.
- **Show the mobile-warning modal (D8):** reuse `InteractiveMobileWarningModal` (or a shell-specific
  copy of it with its own `sessionStorage` dismiss key so it doesn't collide with the interactive
  games' key). Render it from `FakeShellSection`. The shell should still be usable after dismissing.

---

## 12. Projects page integration & removing the old tile

1. **`src/data/interactiveProjects.ts`** — delete the `fake-cli-interface` object (D5). No
   `registry-meta.ts` / `InteractiveAppHost.tsx` change needed (it was never live-registered).
2. **`src/components/projects/FakeShellSection.tsx`** — new section: an `H2` (heading TBD by author),
   a one-line `Paragraph muted` intro/disclaimer, the **mobile-warning modal (D8)**, then
   `<FakeShellApp/>`.
3. **`src/app/projects/page.tsx`** — between the **Other Work** `<div>` grid and the
   `<SectionDivider/>` that precedes `<InteractiveProjectsSection/>`, insert `<SectionDivider/>` +
   `<FakeShellSection/>`. The page stays a server component rendering a client child (fine in Next).
4. **Delete** `public/projects/interactive/fake-cli-interface.svg` (D7).

---

## 13. Build order (phased — matches the requested sequence)

> Scaffold the harness + storage first, wire the UI, *then* implement commands, *then* tests.

**Phase A — Pure harness/scaffolding (no UI):**
1. Add **Vitest** (D6) + `test`/`test:watch` scripts (jsdom dep for the render-safety test only) so
   safety logic is testable from the first commit.
2. `shell.types.ts` + `shell.constants.ts` (all §4 limits, blacklist placeholder, keys, version).
3. `baseImage.ts` (a few read-only/hidden/easter-egg examples + base-path set).
4. `filesystem.ts` — pure tree CRUD with **all caps + read-only enforced here**.
5. `sanitize.ts` + `parser.ts` (tokenize → expand → pipeline → redirections).
6. `storage.ts` (versioned overlay, quota-safe, defensive parse).
7. `commandRegistry.ts` + `executor.ts` (pipe/redirection threading) skeleton.

**Phase B — UI harness:**
8. `useShell.ts` (state, persistence effects, `runLine`, history, vars).
9. `FakeShellApp.tsx` (chrome matching `Terminal.tsx`, scrollback, input, a11y, **MOTD on mount
   (D9)**, keyboard incl. history, Ctrl+L/Ctrl+C, and **Tab completion (D10)**).
10. `FakeShellSection.tsx` (with the **mobile-warning modal, D8**) + wire into `/projects`; remove
    the `fake-cli-interface` tile **and delete its SVG (D7)** (§12).

**Phase C — Commands** (implement against §7 specs, registering each in `commandRegistry`):
`pwd → echo → clear → help (incl. help <cmd>, D10) → ls → cd → mkdir → touch → cat → rm`, then
operators `|`,`>`,`>>` and variable assignment/expansion end-to-end.

**Phase D — Tests/QA + gates:** write the §15 suites; run `npm run test`, `npm run lint`,
`npm run build`; manual QA checklist; tune limits.

---

## 14. Worked example session (target behavior)

A concrete transcript the implementation should reproduce. `guest@portfolio:~$` is the prompt
(home dir shown as `~`). This doubles as a smoke test for the manual QA pass.

```
guest@portfolio:~$ pwd
/home/guest
guest@portfolio:~$ ls
README.md  resume.txt
guest@portfolio:~$ ls -la
drwxr-xr-x  guest guest   .
dr-xr-xr-x  root  root    ..
-rw-r--r--  guest guest   .bashrc
dr-xr-xr-x  guest guest   .secret
-r--r--r--  root  root    README.md
-r--r--r--  root  root    resume.txt
guest@portfolio:~$ echo "hello from the shell" > notes.txt
guest@portfolio:~$ cat notes.txt
hello from the shell
guest@portfolio:~$ echo "second line" >> notes.txt
guest@portfolio:~$ cat notes.txt | cat
hello from the shell
second line
guest@portfolio:~$ GREETING=howdy
guest@portfolio:~$ echo "$GREETING, $USER"
howdy, guest
guest@portfolio:~$ mkdir -p projects/secret
guest@portfolio:~$ rm README.md
rm: cannot remove 'README.md': Permission denied
guest@portfolio:~$ cat .secret/flag.txt
<easter egg here — authored in baseImage.ts>
guest@portfolio:~$ sudo rm -rf /
Nice try. This incident will be reported. 🙂
guest@portfolio:~$ clear
( screen clears )
guest@portfolio:~$ help
( table of the 10 commands + operators + "simulated shell" disclaimer )
```

Persistence checkpoints to verify by hand: after creating `notes.txt`, a **page reload** keeps
`notes.txt` (localStorage, D2) but `$GREETING` is **gone** (in-memory, D3).

---

## 15. QA / test plan

**Test runner: Vitest (D6).** None exists today; add `vitest` + `test`/`test:watch` scripts, with
`jsdom` pulled in only for the one render-safety test. Because all safety logic lives in **pure
modules**, the bulk of tests need no DOM.

Organize tests by module; each maps to §8 IDs:

**`sanitize.test.ts`** — clamps to `MAX_INPUT_LEN` (S2); strips control/ANSI chars (S8); blacklist
matches incl. case/whitespace/diacritic variants and passes clean text (S10); UTF-8 byte counting
for emoji/multibyte (S3/S4); adversarial long inputs finish under a time budget (S11).

**`parser.test.ts`** — quote handling (single vs double, concatenation, unterminated → error);
`$VAR`/`${VAR}` expansion incl. unknown→empty and no-expand-in-single-quotes; assignment detection
incl. `export`; pipeline split + segment/redirection extraction; rejects `>` w/o target, `|` w/o
rhs, `>MAX_PIPE_SEGMENTS`; expansion clamp `MAX_EXPANDED_LEN` (S16); `MAX_ARG_COUNT` (S17).

**`filesystem.test.ts`** — path normalize (`.`,`..`,`~`,absolute/relative, trailing slashes);
`MAX_NODES`/`MAX_DEPTH`/`MAX_NAME_LEN`/`MAX_PATH_LEN` rejections (S4/S5); `MAX_FILE_BYTES` +
`MAX_TOTAL_BYTES` on write/append (S3/S4); read-only blocks write/create/delete; **`__proto__`/**
**`constructor` names rejected and Map-based children prove no prototype pollution** (S9).

**`commands/*.test.ts`** — per §7 behavior + exact error strings & exit codes for each command,
including: `ls -l` perms string for read-only vs writable; `cd -`/`cd ~`/errors; `mkdir`/`mkdir -p`
existing/missing-parent/read-only; `touch` read-only/missing-parent; `rm` dir-without-`-r`,
`-f` on missing, **read-only immovable even with `-f`**, `rm -rf /` leaves base image intact;
`cat` stdin vs files vs dir; `echo -n`.

**`executor.test.ts`** — `a | b | c` stdin/stdout threading; `> file` overwrite & `>> file` append
land in FS and respect caps + read-only + blacklist; redirected stdout doesn't flow downstream;
stderr never piped; final stdout reaches scrollback; `command not found` (127).

**`completion.test.ts`** — Tab completion (D10) as a **pure** helper: first-token completes command
names; later tokens complete paths against the FS (common-prefix, list-on-ambiguity, hidden entries
only surfaced when the fragment starts with `.`). **`help <cmd>`** (D10) returns the registry
`usage` and errors on unknown topics.

**`storage.test.ts`** — round-trip overlay save/load; version mismatch → clean reseed (S13);
corrupted/garbage JSON → reseed, bad key overwritten (S13); base nodes re-stamped, user overlay
restored, read-only **not** unlockable via tampered overlay (S15); `setItem` throwing
`QuotaExceededError` is caught, state preserved, `No space left on device` surfaced (S14).

**`render-safety.test.ts`** (jsdom) — write `<img src=x onerror="...">` / `<script>` as file
content and `cat` it; assert it renders as **literal text** and no element/handler is created (S7);
confirm no `dangerouslySetInnerHTML` usage in the feature (grep-style assertion).

**Manual QA checklist** — run `npm run dev`: shell matches the home terminal visually; help/ls/cd/
mkdir/touch/cat/echo/rm/clear/pwd all behave; `echo hi > a.txt && cat a.txt`-style flows via `>`,
`>>`, `|`; variables set/expand and vanish on **refresh** while files **persist** on reload;
read-only files can't be edited/removed; hidden files appear only with `-a`; easter eggs fire;
pasting a massive blob is clamped; the old `fake-cli-interface` tile is gone; the Interactive
section still renders. **Gates:** `npm run test`, `npm run lint`, `npm run build` all pass.

---

## 16. Risks & resolved questions

| Risk | Mitigation |
|---|---|
| Next 16 API drift (client component, `next/dynamic`) | Read `node_modules/next/dist/docs/` before coding (AGENTS.md). |
| Scope creep (users expect `mv`, `grep`, `nano`) | §0 out-of-scope list is explicit; `help` only advertises implemented commands. |
| Limits too tight/loose | Centralized in `shell.constants.ts`; tune in Phase D with tests. |
| Visual drift from home terminal | Reuse exact chrome classes (§11); QA side-by-side. |

**All prior open questions are resolved** (see §1, D6–D10): Vitest (D6); delete the old SVG (D7);
show the mobile-warning modal (D8); MOTD on startup telling the visitor to `type help for
command-list` (D9); `help <cmd>` + Tab completion built now (D10).

**Only remaining author choice:** the section `H2` heading text on `/projects` (e.g. "Terminal" vs
"Poke around my shell") — pick during build; not a blocker.

---

## 17. Acceptance criteria

- [ ] A shell on `/projects`, **between Other Work and Interactive**, visually matching
      `Terminal.tsx`; the `fake-cli-interface` tile **and its SVG (D7)** are removed and the
      Interactive grid still works.
- [ ] A **startup MOTD (D9)** prints and tells the visitor to `type help for command-list`.
- [ ] The **mobile-warning modal (D8)** shows on small viewports and is dismissable.
- [ ] `ls`/`ls -la`, `cd`, `mkdir` (+`-p`), `touch`, `rm` (+`-r`/`-f`), `cat`, `echo`, `clear`,
      `pwd`, `help` (incl. **`help <cmd>`, D10**) all behave per §7 with bash-like errors; unknown
      command → 127.
- [ ] `>`, `>>`, and `|` work; `NAME=value` + `$NAME` expansion work; **Tab completion (D10)** works.
- [ ] Files **persist across reloads** (localStorage, device-scoped); **variables reset on refresh**.
- [ ] Read-only files/dirs are uneditable/unremovable (incl. `rm -rf`); hidden files show only with
      `-a`; easter eggs are reachable.
- [ ] **No server code, no network requests** — verified (feature is 100% client-side).
- [ ] Every §4 cap enforced; paste-bombs, giant files/trees, output floods, blacklisted words,
      control chars, prototype-pollution names, and HTML/XSS content are all neutralized (§8).
- [ ] localStorage corruption/quota handled gracefully (reseed / `No space left on device`).
- [ ] `npm run test`, `npm run lint`, and `npm run build` all pass with no new TS errors.
```