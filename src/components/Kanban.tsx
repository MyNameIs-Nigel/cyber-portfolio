import type { Accent, KanbanProps } from "@/types";

const tagAccent: Record<Accent, string> = {
  1: "bg-accent-1/10 text-accent-1",
  2: "bg-accent-2/10 text-accent-2",
  3: "bg-accent-3/10 text-accent-3",
  4: "bg-accent-4/10 text-accent-4",
};

export function Kanban({ columns }: KanbanProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {columns.map((col) => (
        <div key={col.title}>
          <h3 className="mb-3 text-sm font-semibold text-fg">{col.title}</h3>
          <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
            {col.items.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-bg/50 p-3">
                <p className="text-sm text-fg">{item.text}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs ${item.tagAccent ? tagAccent[item.tagAccent] : tagAccent[1]}`}
                >
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
