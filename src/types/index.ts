import type { ReactNode } from "react";

export type Accent = 1 | 2 | 3 | 4;

export interface MediaCardProps {
  image: string;
  title: string;
  subtitle: string;
  accent?: Accent;
}

export type ProjectPreview =
  | { mode: "live"; url: string; previewWidth?: number }
  | { mode: "screenshot"; src: string }
  | { mode: "image" };

export interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  image?: string;
  /** When set, the card links to `/projects/{slug}` instead of an external URL. */
  slug?: string;
  preview?: ProjectPreview;
}

export type InteractiveProjectCategory = "game" | "tool" | "portfolio-builder";

export interface InteractiveProject {
  slug: string;
  title: string;
  category: InteractiveProjectCategory;
  /** Public path under `/public`, e.g. `/projects/interactive/retro-tetris.svg` */
  icon: string;
  /** Short copy for the placeholder detail page. */
  description: string;
  status?: "coming-soon" | "live";
}

export interface PhotoCardProps {
  image: string;
  caption?: string;
}

export interface CardGridProps {
  columns?: 2 | 3;
  gap?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

export interface TerminalRow {
  columns: string[];
  statusColor?: "accent-1" | "accent-2" | "accent-3" | "accent-4" | "red";
}

export interface TerminalProps {
  title?: string;
  rows: TerminalRow[];
  columnHeaders?: string[];
  mobileHiddenColumns?: number[];
  input?: {
    prompt: string;
    command: string;
  };
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface ConsoleLogMessage {
  timestamp?: string;
  level: LogLevel;
  text: string;
}

export interface ConsoleLogProps {
  title?: string;
  messages: ConsoleLogMessage[];
}

export interface RoadmapSection {
  label: string;
  accent: Accent;
  title: string;
  description: string;
  number: number;
  icon?: string;
}

export interface RoadmapProps {
  sections: RoadmapSection[];
}

export interface StatSegment {
  label: string;
  sublabel?: string;
  percentage: number;
  accent: Accent;
}

export interface StatBarProps {
  segments: StatSegment[];
}

export interface ValueCardProps {
  title: string;
  description: string;
  accent?: Accent;
}

export interface ToolCardProps {
  emoji: string;
  name: string;
  detail: string;
}

export interface PlusMinusProps {
  plusTitle: string;
  minusTitle: string;
  plusItems: string[];
  minusItems: string[];
}

export interface CodeLine {
  text: string;
  indent: number;
  annotation?: string;
}

export interface CodeSnippetProps {
  filename: string;
  theme?: string;
  lines: CodeLine[];
}

export interface PersonalityTrait {
  label: string;
  value: string;
  percentage: number;
  description: string;
  accent?: Accent;
}

export interface PersonalityProfileProps {
  type: string;
  title: string;
  traits: PersonalityTrait[];
  role?: { title: string; description: string };
  strategy?: { title: string; description: string };
}

export interface KanbanItem {
  text: string;
  tag: string;
  tagAccent?: Accent;
}

export interface KanbanColumn {
  title: string;
  items: KanbanItem[];
}

export interface KanbanProps {
  columns: KanbanColumn[];
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  image?: string;
  /** Also the folder name of the project's dedicated page under `src/app/projects/`. */
  slug: string;
  screenshots: string[];
  /** Plain-text summary paragraphs, reused by the fake shell's `~/projects/<slug>.txt`. */
  content: string[];
  repoUrl?: string;
  preview?: ProjectPreview;
}

export interface MediaItem {
  image: string;
  title: string;
  subtitle: string;
  accent?: Accent;
}

export interface Certification {
  name: string;
  issuer: string;
  /** Earned month and year, e.g. "Jul 2026"; undated study plans omit it. */
  date?: string;
  status: "earned" | "in-progress";
}

export interface SkillCategory {
  title: string;
  items: string[];
  accent: Accent;
}

export interface ToolItem {
  emoji: string;
  name: string;
  detail: string;
}

/**
 * The ssharcade fleet.
 *
 * /projects leads with the arcade — a recorded cast, the connect string, the
 * cabinets — and keeps only the delivery line of the infrastructure. The loop
 * (durability) and the nest (the host) are drawn on the write-up, where a reader
 * who has asked for the machinery will find them.
 */

/** One game on the arcade menu, as a player meets it. */
export interface FleetCabinet {
  /** Display name. */
  name: string;
  /** The entry as it appears in the router's menu. */
  slug: string;
  /** What the game is, in a player's words rather than an operator's. */
  tagline: string;
  status: "online" | "offline";
  /** Shown in place of the port line when the cabinet is not up yet. */
  note?: string;
  accent: Accent;
}

/** One ordered stage of the delivery path. Order carries meaning here. */
export interface PipelineStage {
  /** Two-digit marker. The deploy genuinely is a sequence, so it is numbered. */
  number: string;
  /** Real GitHub Actions job name, or the git action that starts the run. */
  label: string;
  /** `runs-on` value, when this stage is an Actions job. */
  runner?: string;
  /** Real commands, tags and flags — never paraphrased. */
  artifacts: string[];
  /** One line on why the stage is built the way it is. */
  annotation: string;
  accent: Accent;
}

/** One hop of the replication cycle. Deliberately unnumbered — a loop has no first step. */
export interface RecoveryStep {
  label: string;
  detail: string;
  accent: Accent;
}

/** One service inside the host, drawn as containment rather than sequence. */
export interface TopologyNode {
  name: string;
  /** Published port mapping, or the reason there is none. */
  ports: string;
  status: "online" | "offline";
  /** Hardening chips read off deploy/docker-compose.yml. */
  posture: string[];
  accent: Accent;
}

export type InterestId = "photography" | "music" | "coding" | "cars";

/** One hobby on /about, drawn in the sky as a constellation that opens onto its own small experience. */
export interface Interest {
  id: InterestId;
  /** Star-chart numbering, in the order the sky reveals them on the way down. */
  numeral: string;
  /** The constellation's made-up Latin name. */
  constellation: string;
  /** What the Latin means, glossed the way a star atlas would. */
  gloss: string;
  title: string;
  tagline: string;
  description: string;
  /** One line inside the spyglass hinting at what is behind the constellation. */
  teaser: string;
  tags: string[];
  accent: Accent;
}

/** A side project on the coding constellation's branch graph. */
export interface Experiment {
  /** Branch name, without the `feat/` or `wip/` prefix. */
  branch: string;
  title: string;
  description: string;
  /** Merged ships somewhere on the site; open is still an idea or in progress. */
  state: "merged" | "open";
  href?: string;
}
