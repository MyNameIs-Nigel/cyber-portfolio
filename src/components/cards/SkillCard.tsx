import type { Accent } from "@/types";
import { AccentList } from "@/components/AccentList";

const topBar: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

const hoverBorder: Record<Accent, string> = {
  1: "hover:border-accent-1/50",
  2: "hover:border-accent-2/50",
  3: "hover:border-accent-3/50",
  4: "hover:border-accent-4/50",
};

const labelColor: Record<Accent, string> = {
  1: "text-accent-1",
  2: "text-accent-2",
  3: "text-accent-3",
  4: "text-accent-4",
};

export function SkillCard({
  title,
  accent,
  items,
  tag,
}: {
  title: string;
  accent: Accent;
  items: string[];
  tag: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-colors duration-200 ${hoverBorder[accent]}`}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 ${topBar[accent]}`} aria-hidden />
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-lg font-medium tracking-tight text-fg">{title}</p>
        <span className={`font-mono text-xs ${labelColor[accent]}`}>{tag}</span>
      </div>
      <AccentList accent={accent} items={items} />
    </div>
  );
}
