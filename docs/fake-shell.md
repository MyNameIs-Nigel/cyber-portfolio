# The Fake Shell

A faithful, browser-only Unix-ish shell embedded on the `/projects` page. Visitors can poke around a
simulated filesystem, create files, pipe and redirect output, run a scripted `resume.sh`, and trip
over a few easter eggs. **Nothing is ever executed on a server** — it is a pure front-end React
feature. The only outbound “network” behavior is an optional **client-side** `router.push("/")` after
running `./resume.sh` (hard-coded, never user-derived).

---

## Where it lives

```
src/features/terminal/
  shell.types.ts        FsNode/FsFile/FsDir, ShellState, ParsedLine, CommandResult, CommandDef …
  shell.constants.ts    every safety cap, storage key, FS_SCHEMA_VERSION, HOME/USER/HOSTNAME, BLACKLIST
  baseImage.ts          the canonical read-only "disk image" every visitor boots from
  scripts.ts            SCRIPT_HANDLERS — data-driven behavior for executable base files
  seed.ts               first-boot seeding of ~/projects/*.txt from src/data/projects.ts
  sanitize.ts           input cleaning: clamp length, strip control/ANSI chars, blacklist, byte counting
  parser.ts             tokenize (quote-aware) → expand vars → split pipeline → extract redirections
  filesystem.ts         PURE tree ops: resolvePath, normalize, mkdir, write, rm, list, permString
  storage.ts            localStorage load/save: versioned base-image + user overlay, quota-safe
  commandRegistry.ts    name → CommandDef; visible commands for help + Tab completion
  executor.ts           runs a ParsedLine: path execution, pipes, redirects, navigate threading
  completion.ts         pure Tab-completion helper (command names + paths)
  commands/             ls, cd, mkdir, touch, rm, cat, echo, clear, pwd, help, hidden sudo/whoami
  useShell.ts           React hook: ShellState, persistence, runLine(), history, vars, Tab, Ctrl+C/L
  FakeShellApp.tsx      "use client" view — chrome, scrollback, input, useRouter redirect

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

On **first boot** (no overlay for `portfolio-shell-fs:v2`), `storage.ts` also calls `seedProjectFiles()`
to create writable `~/projects/<slug>.txt` files from `src/data/projects.ts` and persists that overlay
immediately.

### Data flow

```
FakeShellApp (UI + useRouter)
  └─ useShell(onNavigate)
       └─ runShellLine(state, raw)            executor.ts
            ├─ parseLine(raw, vars)           parser.ts   → ParsedLine | ParseError
            └─ per pipeline segment:
                 ├─ path execution (./x, /bin/ls) or command.run(ctx)
                 │     scripts.ts for registered executables (resume.sh)
                 ├─ apply redirection (> / >>) filesystem.ts
                 └─ thread stdout → next stdin; thread navigate (last wins)
       └─ saveShellFs(state) if mutated       storage.ts
       └─ onNavigate(href, delayMs) if present  → setTimeout → router.push("/")
```

The UI only ever renders **plain text** React nodes from `CommandResult` — never HTML, never
`dangerouslySetInnerHTML` — so file contents and names can't inject markup.

---

## The filesystem model

`FsNode` is a discriminated union (`shell.types.ts`):

```ts
type FsFile = {
  kind: "file";
  name: string;
  content: string;
  readonly?: boolean;
  hidden?: boolean;
  executable?: boolean;
  mtime: number;
};
type FsDir = { kind: "dir"; name: string; children: Map<string, FsNode>; readonly?: boolean; hidden?: boolean; mtime: number };
```

- **`children` is a `Map`, never a plain object** — prototype-pollution safe (`RESERVED_NAMES` also blocks `__proto__`, etc.).
- **`readonly`** blocks writes/creates/deletes, not traversal.
- **`executable`** marks the one base-image script (`resume.sh`). User-created files never get this bit (no `chmod`).
- **`hidden`** dotfiles only appear with `ls -a`.

`HOME = /home/guest`, `USER = guest`, `HOSTNAME = portfolio`.

### Base image highlights (`baseImage.ts`, `FS_SCHEMA_VERSION = 2`)

| Path | Kind | Notes |
|------|------|-------|
| `/home/guest/README.txt` | file (ro) | how-to; **only** place with the “nothing is real” disclaimer |
| `/home/guest/resume.sh` | file (ro, **exec**) | believable curl script; `./resume.sh` runs `scripts.ts` handler |
| `/home/guest/.bashrc` | file (hidden) | aliases + PS1 |
| `/home/guest/.config/starship.toml` | file (hidden, ro) | prompt config flavor |
| `/home/guest/projects/*.txt` | files (writable) | seeded on first boot from `projects.ts` (overlay, not base) |
| `/etc/motd` | file (ro) | portfolio welcome banner (`cat` shows this only) |
| `/etc/os-release`, `/etc/hostname` | files (ro) | consistent with MOTD |
| `/usr/bin/{curl,git,node,vim}` | exec stubs | `Exec format error` if run |
| `/bin/{bash,sh,ls,cat,…}` | exec stubs | basenames that match registered commands dispatch to them |
| `/var/log/portfolio.log` | file (ro) | sample log lines |
| `/tmp/.X0-lock` | file (ro, hidden) | so `/tmp` isn't empty |

**Login MOTD** (`getMotdContent`): static `/etc/motd` plus a one-line `System time: …` suffix (not stored in the file).

---

## Path execution (`executor.ts`)

If a segment's command token contains `/`, it is treated as a **path**, not a `PATH` lookup:

1. Resolve path → missing: `No such file or directory` (127); directory: `Is a directory` (126).
2. Not `executable` → `Permission denied` (126).
3. Path in `SCRIPT_HANDLERS` → run handler (may set `navigate`).
4. Basename matches a registered command → dispatch (e.g. `/bin/ls` → `ls`).
5. Else → `cannot execute binary file: Exec format error` (126).

Bare `resume.sh` (no `./`) → `command not found` (127), like real bash.

`CommandResult.navigate` is `{ href: "/", delayMs: 1200 }` for `resume.sh` only — never from user input.

---

## Commands

| Command | In `help`? | Summary |
|---------|------------|---------|
| `pwd` `echo` `clear` `help` `ls` `cd` `mkdir` `touch` `cat` `rm` | yes | core utilities |
| `sudo` | no (hidden) | cheeky refusal |
| `whoami` | no (hidden) | prints `guest` |

`help` lists **non-hidden** commands only — no operator line, no simulated-shell disclaimer. `help sudo`
still works for the curious. Tab completion uses the same visible command list.

`ls -l` uses `permString()` including `-r-xr-xr-x` for read-only executables.

---

## Persistence (`storage.ts`)

- **Key:** `portfolio-shell-fs:v2` (`FS_SCHEMA_VERSION = 2`).
- **First boot:** `seedProjectFiles()` → `saveShellFs()` so project files live in the overlay.
- **Return visit:** overlay applied; seeded files are editable/deletable like any user file; no reseed.
- **Version bump:** new key → clean base image + fresh seed (v1 sandboxes ignored).

Session variables remain in-memory only.

---

## Safety budget

Unchanged caps in `shell.constants.ts` (`MAX_FILE_BYTES`, `MAX_NODES`, etc.). Additional rules:

| Concern | Mitigation |
|---------|------------|
| Open redirect | `navigate.href` only from `scripts.ts` registry (`"/"`) |
| Timer leak | `FakeShellApp` clears `setTimeout` on unmount |
| User executables | No code path sets `executable` on writes; no `chmod` |
| `/bin/*` dispatch | Only maps to already-registered pure commands |

No `fetch`, `eval`, or `dangerouslySetInnerHTML` in this feature.

---

## The view (`FakeShellApp.tsx`)

Same terminal chrome as before. After `./resume.sh`, prints curl-style output, a dim `Redirecting…` line,
locks input, then `router.push("/")` after ~1.2s.

---

## Testing

Vitest suites include `scripts`, `seed`, `baseImage`, `commands/help`, plus extended `executor`,
`filesystem`, and `storage` tests. Run `npm run test`, `npm run lint`, `npm run build`.

---

## Adding or changing things

- **New command:** add `commands/<name>.ts`, register in `commands/builtins.ts` (or `help` separately). Set `hidden: true` to omit from `help`/Tab.
- **New executable script:** add ro+exec file in `baseImage.ts` + `BASE_NODE_PATHS`, handler in `scripts.ts`. Do not allow user-created executables.
- **Base-image change:** bump `FS_SCHEMA_VERSION` so visitors reseed.
- **Never** add server routes, `fetch`, `eval`, or user-controlled `router.push` targets in this feature.

---

## Appendix: proposed future commands (not implemented)

1. **`grep`** — search `~/projects/*.txt` and pipes.
2. **`head` / `tail`** — skim long files like `/var/log/portfolio.log`.
3. **`uname -a`** — MOTD-consistent system line ( `whoami` is already hidden).
4. **`tree`** — bounded recursive listing.
5. **`open` / `xdg-open`** — portfolio-aware `router.push` to case-study pages.
6. **`history`** — print in-memory history.
7. **`man`** — longer help pager.
