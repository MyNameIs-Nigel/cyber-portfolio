import type { Accent, StatBarProps } from "@/types";

const segColor: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

const dotColor: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

export function StatBar({ segments }: StatBarProps) {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`${segColor[s.accent]} transition-all duration-200`}
            style={{ width: `${s.percentage}%` }}
            title={`${s.label} ${s.percentage}%`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-2 text-sm text-muted">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor[s.accent]}`} aria-hidden />
            <span className="text-fg">{s.label}</span>
            {s.sublabel ? <span className="text-muted">· {s.sublabel}</span> : null}
            <span className="ml-auto font-mono text-xs text-muted">{s.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
