import { projects } from "@/data/projects";
import { mkdirPath, writeFileContent } from "@/features/terminal/filesystem";
import { SEED_VERSION } from "@/features/terminal/shell.constants";
import type { FsDir } from "@/features/terminal/shell.types";

export { SEED_VERSION };

export function renderProject(p: {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  repoUrl?: string;
  content: string[];
}): string {
  const underline = "=".repeat(p.title.length);
  const tags = p.tags.join(", ");
  const lines = [
    p.title,
    underline,
    "",
    p.description,
    "",
    `Tags: ${tags}`,
    `Live: ${p.link ?? "—"}`,
  ];
  if (p.repoUrl) {
    lines.push(`Repo: ${p.repoUrl}`);
  }
  lines.push("", ...p.content);
  return `${lines.join("\n")}\n`;
}

export function seedProjectFiles(root: FsDir): void {
  mkdirPath(root, "/", "/home/guest/projects", true);
  for (const project of projects) {
    writeFileContent(
      root,
      "/",
      `/home/guest/projects/${project.slug}.txt`,
      renderProject(project),
      false,
    );
  }
}
