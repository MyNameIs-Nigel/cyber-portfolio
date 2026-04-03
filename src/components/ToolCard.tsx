import type { ToolCardProps } from "@/types";

export function ToolCard({ emoji, name, detail }: ToolCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 transition-colors duration-200 hover:border-accent-1/30">
      <div className="mb-2 text-2xl" aria-hidden>
        {emoji}
      </div>
      <p className="text-sm font-medium text-fg">{name}</p>
      <p className="text-xs text-muted">{detail}</p>
    </div>
  );
}
