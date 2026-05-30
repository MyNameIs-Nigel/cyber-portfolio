# Plan: Fake Shell — executable script, realism pass, and seeded project files

**Status:** Draft / not started — planning pass only, **no code written**
**Author:** Planning pass
**Date:** 2026-05-30
**Target stack:** Next.js 16.2 · React 19 · Tailwind v4 · Vercel (static `/projects`)
**Builds on:** `.claude/completed/fake-cli-terminal.md` (the shell already exists and ships)

> ⚠️ Per `AGENTS.md` / `CLAUDE.md`: this is **not** the Next.js you know. The one new piece of
> framework surface here is a client-side **route redirect** (§2, item 1). Before wiring it, read
> `node_modules/next/dist/docs/` for the current `useRouter`/`next/navigation` guidance and heed
> deprecation notices. Everything else is self-contained inside `src/features/terminal/`.

---

## 0. Goal & scope

The fake shell on `/projects` works (commands, pipes, redirects, vars, persistence, safety caps).
This plan **adds depth and strips the "AI wrote this" smell** without weakening any §4 safety budget
from the original plan. Three workstreams:

1. **Executable `resume.sh`** — replace the read-only `resume.txt` with a read-only **executable**
   `resume.sh`. `cat` shows a believable curl install-script; **running it** (`./resume.sh`) prints a
   curl-download animation then, ~1 s later, **redirects the browser to the site home (`/`)** via a
   relative link. Visitors **cannot create their own executables** — this is the only one.
2. **Realism pass** — Ubuntu-style MOTD, de-AI'd file contents, trimmed `help`, no empty
   directories, and an honest audit of which commands earn their place (hide, don't delete, the ones
   that don't).
3. **Seeded project files** — a writable, guest-owned `/home/guest/projects/` directory that ships
   by default with one `<slug>.txt` per entry in `src/data/projects.ts`.

### Out of scope (unchanged from the original plan)
`mv`, `cp`, `grep`, `chmod`, editors, networking, `&&`/`;`, globbing, command substitution,
`eval`/`Function`. No server code, no API route, no fetch (the redirect is a client route push, not a
network call). All new logic stays pure + unit-tested except the redirect side-effect (§2.1).

---

## 1. Decisions locked in this pass

| # | Decision | Rationale |
|---|----------|-----------|
| E1 | **`resume.txt` → `resume.sh`**, read-only **and** executable (new `executable` flag). | User instruction. Read-only so it can't be edited/deleted; executable so it can be run. |
| E2 | **Running an executable = path execution** (`./name`, `/abs/name`, or `name` when cwd holds it via `./`). Bare `resume.sh` with no `./` → `command not found` (authentic bash). | Mirrors real bash: the exec bit + a path are required; `.` is not on `PATH`. Teaches discovery. |
| E3 | **Executable behavior is data-driven**: a `scripts.ts` registry maps an absolute path → handler returning `{stdout, navigate?}`. resume.sh's handler emits the curl block + a `navigate` directive. | Keeps base-image content as plain text while giving the one script real behavior. Extensible. |
| E4 | **Redirect = `useRouter().push("/")`** from `next/navigation`, fired on a `setTimeout` (~1200 ms) after the curl output renders. Relative target `/` (home/index). | User: relative link, "make it look like curl ran, then redirect after ~a second." No absolute URL needed. |
| E5 | **Users cannot create executables.** `touch`/`echo >`/overlay never set the `executable` flag, and there is no `chmod`. Nothing new to block — just never expose a path to set the bit. | User instruction; enforced by omission + a test asserting created files are non-executable. |
| E6 | **MOTD becomes Ubuntu-login-shaped.** Static banner lives in `/etc/motd`; the dynamic "system information / last login" block is generated at boot (mirrors `update-motd.d`, not stored in the file). The "Nothing here is real…" disclaimer is **removed from MOTD**. | User: real-feeling MOTD, drop the disclaimer line. |
| E7 | **The disclaimer line lives only in the home README**, which is **renamed `README.md` → `README.txt`** (plainer, more shell-like). | User: "that should only be in the readme.txt." |
| E8 | **`help` drops the `Operators:` line and the "Simulated shell — nothing here is real…" line.** It also hides commands flagged `hidden`. | User: let visitors discover operators themselves; no disclaimer in help. |
| E9 | **No empty directories.** `.config`, `/usr`, `/bin`, `/var`, `/tmp` each get believable content (§2.2). Recommendation is **populate, not delete** (a Unix box with no `/bin` reads as more broken than a populated one). | User rule: empty dirs get content or get deleted; populate is the more realistic choice. |
| E10 | **Command audit → hide, never delete.** Add a `hidden?: boolean` to `CommandDef`; hidden commands still run + still answer `help <cmd>`, they're just absent from the `help` list. No current command is removed. | User: "remove from the help screen but not actually remove them." Same discovery theme as operators. |
| E11 | **Seeded project files are seeded once into the overlay on first boot**, not baked into the base image. | The existing overlay machinery already persists edits *and* deletions; first-boot seeding reuses it with **no** tombstones and no re-stamp conflict. Guest-owned + editable falls out for free. |
| E12 | **Bump `FS_SCHEMA_VERSION` 1 → 2.** | Introducing seeded files + renamed README + resume.sh changes the canonical image; a version bump cleanly reseeds every existing sandbox (the original plan's D2 "version bump = clean slate"). Avoids a per-user migration path. |

**Author choices left open (pick during build, not blockers):** exact MOTD copy / distro version
string; the cosmetic URL inside `resume.sh` (the *real* redirect is `/`); the believable filenames
chosen to fill `/usr`/`/bin`/`/var`.

---

## 2. Workstreams

### 2.1 Executable `resume.sh` + path execution + redirect

**Type changes (`shell.types.ts`):**
- `FsFile` gains `executable?: boolean`.
- `CommandResult` gains `navigate?: { href: string; delayMs: number }`.
- `ExecuteOutcome` (in `executor.ts`) gains `navigate?: { href: string; delayMs: number }`, surfaced
  from whichever segment produced it (last wins).

**Base image (`baseImage.ts`):**
- Delete the `resume.txt` node; add `resume.sh` (read-only, `executable: true`) whose **content** is a
  believable curl-style installer, e.g.:
  ```sh
  #!/usr/bin/env bash
  # resume.sh — pull the latest copy of my résumé and open the site
  set -euo pipefail
  RESUME_URL="https://nigelsmith.dev/resume.pdf"
  DEST="${HOME}/Downloads/nigel-smith-resume.pdf"
  echo "Fetching résumé from ${RESUME_URL} ..."
  curl -fsSL --retry 3 -o "${DEST}" "${RESUME_URL}"
  echo "Saved to ${DEST}"
  command -v xdg-open >/dev/null && xdg-open "https://nigelsmith.dev" || open "https://nigelsmith.dev"
  ```
- Update `BASE_NODE_PATHS`: drop `/home/guest/resume.txt`, add `/home/guest/resume.sh`.
- Rename `README.md` → `README.txt` (E7); move the "Nothing here is real or executed. Files persist
  in your browser only." disclaimer here, and **only** here. Update `BASE_NODE_PATHS` accordingly.

**Script registry (new `src/features/terminal/scripts.ts`):**
- `SCRIPT_HANDLERS: Map<string, (ctx) => CommandResult>` keyed by absolute path.
- `/home/guest/resume.sh` → handler returns a static curl-progress block as `stdout`, e.g.:
  ```
  Fetching résumé from https://nigelsmith.dev/resume.pdf ...
    % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                   Dload  Upload   Total   Spent    Left  Speed
  100  248k  100  248k    0     0   612k      0 --:--:-- --:--:-- --:--:--  611k
  Saved to /home/guest/Downloads/nigel-smith-resume.pdf
  Opening https://nigelsmith.dev ↗
  ```
  plus `navigate: { href: "/", delayMs: 1200 }`.

**Executor (`executor.ts`) — `runSegment`:**
- Before the registry lookup, if `cmd` contains `/` (i.e. `./resume.sh`, `/home/guest/resume.sh`,
  `/bin/ls`), treat it as **path execution**:
  - resolve via `resolvePath`; not found → `bash: <cmd>: No such file or directory` (127);
  - directory → `bash: <cmd>: Is a directory` (126);
  - file but `!executable` → `bash: <cmd>: Permission denied` (126);
  - executable + has a `SCRIPT_HANDLERS` entry → run it (carries `navigate`);
  - executable + basename matches a **registered command** (covers `/bin/ls`, §2.2) → dispatch to that
    command with the remaining argv;
  - executable + neither → `bash: <cmd>: cannot execute binary file: Exec format error` (126) — a real
    bash message, so the empty "binaries" in `/bin` behave plausibly.
- Bare `cmd` with no `/` keeps today's behavior (registry or `command not found`) — so `resume.sh`
  alone is `command not found`, `./resume.sh` runs (E2).
- Thread `navigate` from the segment result up through `executeParsedLine` → `ExecuteOutcome`.

**Hook + view (`useShell.ts`, `FakeShellApp.tsx`):**
- `FakeShellApp` calls `useRouter()` (`next/navigation`) and passes a `navigate(href, delayMs)`
  callback into the hook (or the hook returns a `pendingNavigate` the view reacts to).
- On an outcome with `navigate`: render stdout normally, then `setTimeout(() => router.push(href),
  delayMs)`. Store the timer in a ref and clear it on unmount. Optionally print a dim
  `Redirecting…` line and disable the input while the timer is pending.
- Guard: `typeof window` not needed (client component), but the timer must be cleaned up.

**Permissions display (`filesystem.ts permString`):**
- Executable file → `-r-xr-xr-x` (read-only + exec) / `-rwxr-xr-x` (writable + exec). `ls -l`
  already calls `permString`, so the bit shows up for free.

### 2.2 Realism pass

**MOTD (`baseImage.ts` + `getMotdContent`):**
- `/etc/motd` static content = Ubuntu-style welcome + bullets, **no disclaimer**, with one custom
  discovery line, e.g.:
  ```
  Welcome to Ubuntu 24.04.2 LTS (GNU/Linux 6.8.0-52-generic x86_64)

   * Documentation:  https://help.ubuntu.com
   * Management:     https://nigelsmith.dev
   * Support:        https://nigelsmith.dev/contact
   * New here?       Run `help` to see what this shell can do.
  ```
- `getMotdContent(fs)` returns the static file **plus** a dynamically generated block built at boot:
  ```
    System information as of <Date.now() formatted>

    System load:  0.04               Processes:              98
    Usage of /:   23.1% of 24.5GB    Users logged in:         1
    Memory usage: 18%                IPv4 address for eth0:  10.10.0.42
    Swap usage:   0%

  0 updates can be applied immediately.

  Last login: <formatted> from 10.10.0.1
  ```
  `cat /etc/motd` shows only the static banner (mirrors how `update-motd.d` isn't in the file).

**De-AI file contents (`baseImage.ts`):**
- `.bashrc` → realistic aliases + `PS1` instead of `# simulated bashrc`.
- Add `/etc/os-release` and `/etc/hostname` (read-only) so the Ubuntu claim is internally consistent
  (`cat /etc/os-release` works). Add their paths to `BASE_NODE_PATHS`.
- Keep `/etc/passwd`, `/etc/portfolio.conf`, `/etc/secrets.env` (the "you really thought?" egg).
- `README.txt` copy rewritten to read like a person wrote it (and it's the sole home of the
  disclaimer line per E7).

**Trim `help` (`commands/help.ts`):**
- Remove the `Operators: > >> |` line and the "Simulated shell — nothing here is real or executed."
  line. Build the list from `listCommands()` filtered to **non-hidden** commands. Keep a single
  `Type 'help <command>' for details.` footer.

**Command audit (`commandRegistry.ts` / `shell.types.ts`):**
- Add `hidden?: boolean` to `CommandDef`. `listCommands()` (used by `help` + Tab completion's
  command list) filters out hidden; `getCommand()` still returns them, so they run and `help <cmd>`
  works for the curious (E10).
- Findings: all ten current commands (`pwd echo clear help ls cd mkdir touch cat rm`) are realistic
  and stay **documented**. The genuinely "can't-really-use-this" surface is the *missing* tools
  visitors reach for (`grep`, `less`, `head`, `tail`, `man`, `whoami`) — those are proposals in
  `docs/fake-shell.md`, not removals. **Recommendation: hide nothing by default, but ship the
  `hidden` mechanism** and use it for the discovery-reward commands `whoami` and `sudo`:
  - promote `sudo` from its current hard-coded special-case in `executor.ts` into a real (hidden)
    command so it's uniform; keep the "Nice try. This incident will be reported. 🙂" reply.
  - add a hidden `whoami` → prints `guest` (trivial, rewards exploration, mirrors the hidden-operators
    theme). *(If Nigel prefers zero new commands, drop `whoami`; the `hidden` flag still earns its
    keep by hiding `sudo`.)*

**No empty directories (`baseImage.ts`):** resolve each current empty dir — **populate** (E9):

| Dir | Today | Resolution |
|-----|-------|-----------|
| `/home/guest/.config` | empty, hidden, ro | add `.config/starship.toml` (ro) with a believable prompt config |
| `/usr` | empty, ro | add `/usr/bin/` containing ro-exec stubs `curl git node vim` |
| `/bin` | empty, ro | add ro-exec stubs for real coreutils: `bash sh ls cat echo mkdir rm touch pwd` (the implemented ones dispatch via §2.1; the rest hit `Exec format error`) |
| `/var` | empty, ro | add `/var/log/portfolio.log` (ro) with a couple believable log lines |
| `/tmp` | empty, writable | seed one believable lock file `/tmp/.X0-lock` (ro base node) so it isn't empty; `/tmp` stays the writable scratch area |

Each new file/dir path is added to `BASE_NODE_PATHS` so it's re-stamped + protected. Node count rises
by ~20, well under `MAX_NODES = 200`.

### 2.3 Seeded project files

**New `src/features/terminal/seed.ts`:**
- Imports `projects` from `@/data/projects` (plain data, client-safe).
- `SEED_VERSION` constant.
- `seedProjectFiles(root: FsDir)`: `mkdirPath(root, "/", "/home/guest/projects", true)` then, per
  project, `writeFileContent(root, "/", "/home/guest/projects/<slug>.txt", renderProject(p), false)`.
  Files land **writable + guest-owned** (not in `BASE_NODE_PATHS`, not read-only).
- `renderProject(p)` formats one project as plain text, e.g.:
  ```
  <title>
  =========

  <description>

  Tags: <tags joined>
  Live: <link>
  Repo: <repoUrl, if present>

  <content paragraphs, blank-line separated>
  ```
  Slugs map 1:1 to filenames: `full-coverage-technology.txt`, `walton-tax-professionals.txt`,
  `photography-portfolio.txt`, `grade-calculator.txt`.

**Wiring (`storage.ts loadShellFs`):**
- First boot (no stored overlay for `STORAGE_KEY` at v2): start from `createBaseImage()`, call
  `seedProjectFiles`, then **persist immediately** (`saveShellFs`) so the seed becomes part of the
  overlay. Return `{ fs, cwd }`.
- Returning visitor (overlay present): apply overlay as today — the project files are whatever the
  visitor left them as (edited, untouched, or deleted). No reseed, no tombstones.
- Because seeded files are normal writable overlay nodes, `rm`/`echo >`/edits all persist exactly
  like user-created files. Read-only protection does **not** apply to them (they're guest-owned).

---

## 3. File-by-file change list

| File | Change |
|------|--------|
| `shell.types.ts` | `FsFile.executable?`, `CommandResult.navigate?`, `CommandDef.hidden?` |
| `shell.constants.ts` | `FS_SCHEMA_VERSION = 2`; add `SEED_VERSION` |
| `baseImage.ts` | resume.sh (ro+exec), README.txt rename, Ubuntu MOTD + dynamic block, `.bashrc`/`os-release`/`hostname`, populate `.config`/`usr`/`bin`/`var`/`tmp`, update `BASE_NODE_PATHS` |
| `scripts.ts` *(new)* | `SCRIPT_HANDLERS`; resume.sh handler (curl block + navigate) |
| `seed.ts` *(new)* | `seedProjectFiles`, `renderProject`, `SEED_VERSION` |
| `executor.ts` | path-execution branch in `runSegment`; thread `navigate` into `ExecuteOutcome`; remove the hard-coded `sudo` case (now a hidden command) |
| `commandRegistry.ts` | register hidden `sudo` (+ optional `whoami`); `listCommands()` filters hidden, add `allCommands()` if needed |
| `commands/help.ts` | drop operators + disclaimer lines; list non-hidden only |
| `commands/whoami.ts` *(new, optional)* | hidden; prints `guest` |
| `commands/sudo.ts` *(new)* | hidden; the cheeky reply |
| `filesystem.ts` | `permString` honors `executable` |
| `storage.ts` | first-boot seeding; bump-driven reseed via v2 key |
| `useShell.ts` | surface `navigate`; accept a navigate callback |
| `FakeShellApp.tsx` | `useRouter`; `setTimeout` redirect with ref cleanup; optional `Redirecting…` line |
| `completion.ts` | command-name completion uses non-hidden list (don't surface hidden cmds) |

No change needed to `FakeShellSection.tsx`, `parser.ts`, `sanitize.ts`, or `/projects/page.tsx`.

---

## 4. Safety — deltas only (original §4/§8 budget unchanged)

| Concern | Mitigation |
|---|---|
| Redirect abuse / open-redirect | `navigate.href` is **never** user-derived — it is a hard-coded `/` from the script registry. No user input flows into `router.push`. |
| Pending-timer leak / redirect after unmount | Timer stored in a ref, cleared on unmount; only one in flight. |
| Executable escalation | No code path sets `executable` on user writes; no `chmod`. Asserted by test (E5). |
| Seeded files count against caps | `seedProjectFiles` goes through `writeFileContent`/`mkdirPath`, so `MAX_FILE_BYTES`/`MAX_NODES`/`MAX_TOTAL_BYTES` still apply; four short files are far under budget. |
| `/bin/<x>` dispatch running arbitrary code | Dispatch only maps a basename to an **already-registered** pure command; unknown basenames hit `Exec format error`. No eval. |
| Schema bump wipes sandboxes | Intended (E12); same behavior the original plan documents for version bumps. |

XSS/plain-text rendering, prototype-pollution (Map children), control-char stripping, ReDoS-safe
regexes, localStorage quota/corruption handling — **all unchanged and still in force.**

---

## 5. Build order

**Phase A — types + base image (no behavior yet):**
1. `shell.types.ts` flags; `FS_SCHEMA_VERSION = 2` + `SEED_VERSION`.
2. `baseImage.ts`: resume.sh, README.txt rename, MOTD, de-AI'd content, populate empty dirs, update
   `BASE_NODE_PATHS`; `permString` exec bit.

**Phase B — execution + redirect:**
3. `scripts.ts` registry + resume.sh handler.
4. `executor.ts` path-execution branch + `navigate` threading; move `sudo` out of the special-case.
5. `useShell.ts` + `FakeShellApp.tsx` redirect plumbing (read the `next/navigation` doc first).

**Phase C — realism:**
6. `commandRegistry.ts` + `commands/help.ts` + new hidden `sudo`/`whoami`; completion uses non-hidden.

**Phase D — seeding:**
7. `seed.ts` + `storage.ts` first-boot seeding.

**Phase E — tests/QA + gates:** §6 suites; `npm run test`, `npm run lint`, `npm run build`; manual QA.

---

## 6. Test plan (extends the existing Vitest suites)

- **`scripts.test.ts`** *(new)* — resume.sh handler returns the curl block + `navigate {href:"/",
  delayMs:1200}`; registry keyed by absolute path.
- **`executor.test.ts`** *(extend)* — `./resume.sh` runs the handler and surfaces `navigate`;
  `/bin/ls` dispatches to `ls`; non-executable path → `Permission denied` (126); missing path → 127;
  bare `resume.sh` → `command not found` (127); empty `/bin/sh` stub → `Exec format error` (126);
  `navigate` propagates through a pipeline.
- **`filesystem.test.ts`** *(extend)* — `permString` returns `-r-xr-xr-x` for ro+exec; a file created
  by `touch`/`echo >` is **not** executable (E5).
- **`commands/help.test.ts`** *(new/extend)* — output has no `Operators:` and no disclaimer line;
  hidden commands (`sudo`, `whoami`) are absent from the list but `help sudo` still resolves.
- **`seed.test.ts`** *(new)* — `seedProjectFiles` creates `/home/guest/projects` + one `.txt` per
  `projects` slug, writable + guest-owned; `renderProject` includes title/description/tags/link.
- **`storage.test.ts`** *(extend)* — first boot (empty storage, v2) seeds project files and persists
  them; deleting a seeded file then reloading keeps it deleted (overlay, no reseed); a v1 key is
  ignored and the sandbox reseeds at v2.
- **`baseImage.test.ts`** *(new/extend)* — no directory in the base image is empty; `cat /etc/motd`
  has no disclaimer; the disclaimer string appears only in `README.txt`; `resume.sh` is ro+exec and
  `resume.txt` is gone.
- **Manual QA** — `cat resume.sh` shows the script; `./resume.sh` animates curl then redirects to the
  home page after ~1 s; `resume.sh` alone says command not found; `ls -l` shows the exec bit; MOTD
  reads like Ubuntu with no disclaimer; `help` has no operators/disclaimer; `sudo`/`whoami` work but
  aren't listed; `ls /bin /usr /var ~/.config` are all non-empty; `ls ~/projects` lists the four
  files and `cat ~/projects/<slug>.txt` reads well; editing a project file survives reload; deleting
  one stays deleted. **Gates:** `npm run test`, `npm run lint`, `npm run build` all pass.

---

## 7. Acceptance criteria

- [ ] `resume.txt` is gone; `resume.sh` exists, is read-only **and** executable, and `cat`s as a
      believable curl script.
- [ ] `./resume.sh` prints a curl download animation, then ~1 s later redirects to `/` (relative);
      bare `resume.sh` → `command not found`. Visitors cannot create any other executable.
- [ ] MOTD is Ubuntu-login-shaped with **no** "nothing here is real" disclaimer; that line appears
      **only** in `README.txt` (renamed from `README.md`).
- [ ] `help` no longer prints the `Operators:` line or the simulated-shell disclaimer; hidden
      commands run but aren't listed.
- [ ] No directory in the base image is empty (`.config`, `/usr`, `/bin`, `/var`, `/tmp` populated).
- [ ] `/home/guest/projects/` ships with one writable, guest-owned `<slug>.txt` per `projects.ts`
      entry; edits and deletions persist across reloads.
- [ ] All original §4 caps and §8 mitigations still hold; the redirect target is hard-coded, never
      user-derived; created files are never executable.
- [ ] `docs/fake-shell.md` is updated to match the shipped behavior.
- [ ] `npm run test`, `npm run lint`, and `npm run build` pass with no new TS errors.
