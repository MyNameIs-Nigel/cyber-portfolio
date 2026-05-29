import { HOME, USER } from "@/features/terminal/shell.constants";
import type { FsDir, FsFile, FsNode } from "@/features/terminal/shell.types";

const NOW = 1_700_000_000_000;

type FileOpts = { readonly?: boolean; hidden?: boolean; mtime?: number };
type DirOpts = { readonly?: boolean; hidden?: boolean; mtime?: number };

function file(name: string, content: string, opts: FileOpts = {}): FsFile {
  return {
    kind: "file",
    name,
    content,
    readonly: opts.readonly,
    hidden: opts.hidden,
    mtime: opts.mtime ?? NOW,
  };
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
              "README.md": file(
                "README.md",
                `# Welcome to the portfolio shell

This is a simulated terminal — nothing here is real or executed.

Type \`help\` for available commands. Create files under your home directory.`,
                { readonly: true },
              ),
              "resume.txt": file(
                "resume.txt",
                "Nigel Smith — see the main site for contact and resume details.",
                { readonly: true },
              ),
              ".bashrc": file(".bashrc", "# simulated bashrc\nexport USER=guest\n", { hidden: true }),
              ".config": dir(".config", {}, { hidden: true, readonly: true }),
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
          motd: file(
            "motd",
            `Welcome to ${USER}@portfolio — simulated shell environment.

Nothing here is real or executed. Files persist in your browser only.

Type help for command-list.`,
            { readonly: true },
          ),
          passwd: file(
            "passwd",
            "root:x:0:0:root:/root:/bin/false\nguest:x:1000:1000:Guest:/home/guest:/bin/sh\n",
            { readonly: true },
          ),
          "portfolio.conf": file(
            "portfolio.conf",
            "# portfolio shell config\nSHELL=fake\nHOST=portfolio\n",
            { readonly: true },
          ),
          "secrets.env": file("secrets.env", "you really thought?\n", { readonly: true, hidden: true }),
        },
        { readonly: true },
      ),
      usr: dir("usr", {}, { readonly: true }),
      bin: dir("bin", {}, { readonly: true }),
      var: dir("var", {}, { readonly: true }),
      tmp: dir("tmp", {}, {}),
    },
    { readonly: true },
  );
}

/** Stable absolute paths owned by the base image (re-stamped on load). */
export const BASE_NODE_PATHS = new Set<string>([
  "/",
  "/home",
  "/home/guest",
  "/home/guest/README.md",
  "/home/guest/resume.txt",
  "/home/guest/.bashrc",
  "/home/guest/.config",
  "/home/guest/.secret",
  "/home/guest/.secret/flag.txt",
  "/etc",
  "/etc/motd",
  "/etc/passwd",
  "/etc/portfolio.conf",
  "/etc/secrets.env",
  "/usr",
  "/bin",
  "/var",
  "/tmp",
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

export function getMotdContent(fs: FsDir): string {
  const motd = resolveMotdFile(fs);
  return motd?.content ?? "Type help for command-list.\n";
}

function resolveMotdFile(fs: FsDir): FsFile | undefined {
  const etc = fs.children.get("etc");
  if (!etc || etc.kind !== "dir") return undefined;
  const motd = etc.children.get("motd");
  return motd?.kind === "file" ? motd : undefined;
}

export { HOME };
