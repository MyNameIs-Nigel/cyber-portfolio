import { HOME } from "@/features/terminal/shell.constants";
import type { FsDir, FsFile, FsNode } from "@/features/terminal/shell.types";

const NOW = 1_700_000_000_000;

const RESUME_SH = `#!/usr/bin/env bash
# resume.sh — pull the latest copy of my résumé and open the site
set -euo pipefail
RESUME_URL="https://nigelsmith.dev/resume.pdf"
DEST="\${HOME}/Downloads/nigel-smith-resume.pdf"
echo "Fetching résumé from \${RESUME_URL} ..."
curl -fsSL --retry 3 -o "\${DEST}" "\${RESUME_URL}"
echo "Saved to \${DEST}"
command -v xdg-open >/dev/null && xdg-open "https://nigelsmith.dev" || open "https://nigelsmith.dev"
`;

const README_TXT = `Welcome to my portfolio shell.

This is a browser-only playground — nothing here is real or executed on a server.
Files you create under ~/ persist in your browser only.

Nothing here is real or executed. Files persist in your browser only.

Try: help, ls -la, cat resume.sh, ./resume.sh
`;

const MOTD_STATIC = `Welcome to Nigel's Portfolio Shell

 * Documentation:  https://help.ubuntu.com
 * Management:     https://nigelsmith.dev
 * Support:        https://nigelsmith.dev/contact
 * New here?       Run \`help\` to see what this shell can do.
`;

type FileOpts = { readonly?: boolean; hidden?: boolean; executable?: boolean; mtime?: number };
type DirOpts = { readonly?: boolean; hidden?: boolean; mtime?: number };

function file(name: string, content: string, opts: FileOpts = {}): FsFile {
  return {
    kind: "file",
    name,
    content,
    readonly: opts.readonly,
    hidden: opts.hidden,
    executable: opts.executable,
    mtime: opts.mtime ?? NOW,
  };
}

function execStub(name: string, content = ""): FsFile {
  return file(name, content, { readonly: true, executable: true });
}

function dir(name: string, children: Record<string, FsNode>, opts: DirOpts = {}): FsDir {
  return {
    kind: "dir",
    name,
    children: new Map(Object.entries(children)),
    readonly: opts.readonly,
    hidden: opts.hidden,
    mtime: opts.mtime ?? NOW,
  };
}

function buildTree(): FsDir {
  return dir(
    "",
    {
      home: dir(
        "home",
        {
          guest: dir(
            "guest",
            {
              "README.txt": file("README.txt", README_TXT, { readonly: true }),
              "resume.sh": file("resume.sh", RESUME_SH, { readonly: true, executable: true }),
              ".bashrc": file(
                ".bashrc",
                `# ~/.bashrc — guest session
alias ll='ls -la'
alias la='ls -A'
alias ..='cd ..'
export PS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
`,
                { hidden: true },
              ),
              ".config": dir(
                ".config",
                {
                  "starship.toml": file(
                    "starship.toml",
                    `# ~/.config/starship.toml
[character]
success_symbol = "[➜](bold green)"
error_symbol = "[✗](bold red)"

[directory]
truncation_length = 3
`,
                    { readonly: true, hidden: true },
                  ),
                },
                { hidden: true, readonly: true },
              ),
              ".secret": dir(
                ".secret",
                {
                  "flag.txt": file(
                    "flag.txt",
                    "portfolio{easter_egg_found}\nYou found the hidden flag. Nice work.",
                    { readonly: true, hidden: true },
                  ),
                },
                { hidden: true, readonly: true },
              ),
            },
            {},
          ),
        },
        { readonly: true },
      ),
      etc: dir(
        "etc",
        {
          motd: file("motd", MOTD_STATIC, { readonly: true }),
          hostname: file("hostname", "portfolio\n", { readonly: true }),
          "os-release": file(
            "os-release",
            `PRETTY_NAME="Ubuntu 24.04.2 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.2 LTS (Noble Numbat)"
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
`,
            { readonly: true },
          ),
          passwd: file(
            "passwd",
            "root:x:0:0:root:/root:/bin/false\nguest:x:1000:1000:Guest:/home/guest:/bin/sh\n",
            { readonly: true },
          ),
          "portfolio.conf": file(
            "portfolio.conf",
            "# portfolio shell config\nSHELL=/bin/bash\nHOST=portfolio\n",
            { readonly: true },
          ),
          "secrets.env": file("secrets.env", "you really thought?\n", { readonly: true, hidden: true }),
        },
        { readonly: true },
      ),
      usr: dir(
        "usr",
        {
          bin: dir(
            "bin",
            {
              curl: execStub("curl"),
              git: execStub("git"),
              node: execStub("node"),
              vim: execStub("vim"),
            },
            { readonly: true },
          ),
        },
        { readonly: true },
      ),
      bin: dir(
        "bin",
        {
          bash: execStub("bash"),
          sh: execStub("sh"),
          ls: execStub("ls"),
          cat: execStub("cat"),
          echo: execStub("echo"),
          mkdir: execStub("mkdir"),
          rm: execStub("rm"),
          touch: execStub("touch"),
          pwd: execStub("pwd"),
        },
        { readonly: true },
      ),
      var: dir(
        "var",
        {
          log: dir(
            "log",
            {
              "portfolio.log": file(
                "portfolio.log",
                `2026-05-28T14:02:11Z INFO  portfolio-shell session start user=guest
2026-05-29T09:41:03Z INFO  static export OK routes=12
`,
                { readonly: true },
              ),
            },
            { readonly: true },
          ),
        },
        { readonly: true },
      ),
      tmp: dir(
        "tmp",
        {
          ".X0-lock": file(".X0-lock", "", { readonly: true, hidden: true }),
        },
        {},
      ),
    },
    { readonly: true },
  );
}

/** Stable absolute paths owned by the base image (re-stamped on load). */
export const BASE_NODE_PATHS = new Set<string>([
  "/",
  "/home",
  "/home/guest",
  "/home/guest/README.txt",
  "/home/guest/resume.sh",
  "/home/guest/.bashrc",
  "/home/guest/.config",
  "/home/guest/.config/starship.toml",
  "/home/guest/.secret",
  "/home/guest/.secret/flag.txt",
  "/etc",
  "/etc/motd",
  "/etc/hostname",
  "/etc/os-release",
  "/etc/passwd",
  "/etc/portfolio.conf",
  "/etc/secrets.env",
  "/usr",
  "/usr/bin",
  "/usr/bin/curl",
  "/usr/bin/git",
  "/usr/bin/node",
  "/usr/bin/vim",
  "/bin",
  "/bin/bash",
  "/bin/sh",
  "/bin/ls",
  "/bin/cat",
  "/bin/echo",
  "/bin/mkdir",
  "/bin/rm",
  "/bin/touch",
  "/bin/pwd",
  "/var",
  "/var/log",
  "/var/log/portfolio.log",
  "/tmp",
  "/tmp/.X0-lock",
]);

export function cloneNode(node: FsNode): FsNode {
  if (node.kind === "file") {
    return { ...node, content: node.content };
  }
  const children = new Map<string, FsNode>();
  for (const [k, v] of node.children) {
    children.set(k, cloneNode(v));
  }
  return { ...node, children };
}

export function createBaseImage(): FsDir {
  const root = buildTree();
  return cloneNode(root) as FsDir;
}

function formatMotdTimestamp(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatMotdDynamicBlock(now: number): string {
  return `\n  System time: ${formatMotdTimestamp(now)}\n`;
}

export function getMotdContent(fs: FsDir): string {
  const motd = resolveMotdFile(fs);
  const staticPart = motd?.content ?? "";
  return staticPart + formatMotdDynamicBlock(Date.now());
}

function resolveMotdFile(fs: FsDir): FsFile | undefined {
  const etc = fs.children.get("etc");
  if (!etc || etc.kind !== "dir") return undefined;
  const motd = etc.children.get("motd");
  return motd?.kind === "file" ? motd : undefined;
}

export { HOME };
