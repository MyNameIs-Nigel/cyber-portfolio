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
  slug: string;
  screenshots: string[];
  /** One string per paragraph in the case study write-up. */
  content: string[];
  demoUrl?: string;
  repoUrl?: string;
  preview?: ProjectPreview;
}

export interface MediaItem {
  image: string;
  title: string;
  subtitle: string;
  accent?: Accent;
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
