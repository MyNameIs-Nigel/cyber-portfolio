export type FsFile = {
  kind: "file";
  name: string;
  content: string;
  readonly?: boolean;
  hidden?: boolean;
  executable?: boolean;
  mtime: number;
};

export type FsDir = {
  kind: "dir";
  name: string;
  children: Map<string, FsNode>;
  readonly?: boolean;
  hidden?: boolean;
  mtime: number;
};

export type FsNode = FsFile | FsDir;

export type OutputLine = {
  text: string;
  variant: "normal" | "error" | "prompt";
};

export type ShellState = {
  fs: FsDir;
  cwd: string;
  oldpwd: string;
  vars: Map<string, string>;
  scrollback: OutputLine[];
  history: string[];
};

export type CommandResult = {
  stdout: string;
  stderr: string;
  code: number;
  clearScrollback?: boolean;
  navigate?: { href: string; delayMs: number };
};

export type CommandCtx = {
  args: string[];
  stdin: string;
  cwd: string;
  state: ShellState;
};

export type CommandHandler = (ctx: CommandCtx) => CommandResult;

export type CommandDef = {
  name: string;
  run: CommandHandler;
  summary: string;
  usage: string;
  hidden?: boolean;
};

export type RedirectSpec = { mode: ">" | ">>"; target: string };

export type PipelineSegment = {
  argv: string[];
  redirect?: RedirectSpec;
};

export type ParsedAssignment = {
  kind: "assignment";
  name: string;
  value: string;
  exportAlias?: boolean;
};

export type ParsedPipeline = {
  kind: "pipeline";
  segments: PipelineSegment[];
};

export type ParsedLine = ParsedAssignment | ParsedPipeline;

export type OverlayEntry = {
  path: string;
  kind: "file" | "dir";
  content?: string;
  mtime: number;
};

export type PersistedOverlay = {
  version: number;
  entries: OverlayEntry[];
};
