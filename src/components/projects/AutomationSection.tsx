import { H2, Paragraph } from "@/components/Typography";
import { accentChip, accentText } from "@/components/projects/fleet/accents";
import { automationProjects, type AutomationProject } from "@/data/automation";
import type { Accent } from "@/types";

const topBar: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

const statusLabel: Record<AutomationProject["status"], string> = {
  "in-use": "In use",
  "in-progress": "In progress",
};

/**
 * Self-hosted automation and AI workflow projects. None of them has a public
 * page, so each card carries the whole story and says how finished it is.
 */
export function AutomationSection({ headingClassName = "" }: { headingClassName?: string }) {
  return (
    <section id="automation" className="scroll-mt-16" aria-labelledby="automation-heading">
      <H2 id="automation-heading" className={headingClassName}>
        Automation &amp; AI Workflows
      </H2>
      <Paragraph muted>
        Smaller tools I run on my own hardware, mostly to hand repetitive work to scripts and language models.
      </Paragraph>

      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {automationProjects.map((project) => (
          <li key={project.title}>
            <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface p-5">
              <span className={`absolute inset-x-0 top-0 h-0.5 ${topBar[project.accent]}`} aria-hidden />
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold text-fg">{project.title}</h3>
                <span
                  className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    project.status === "in-use" ? accentText[project.accent] : "text-muted"
                  }`}
                >
                  {statusLabel[project.status]}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{project.description}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <li key={tag} className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${accentChip[project.accent]}`}>
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
