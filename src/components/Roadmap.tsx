import type { Accent, RoadmapProps } from "@/types";

const accentLabel: Record<Accent, string> = {
  1: "text-accent-1",
  2: "text-accent-2",
  3: "text-accent-3",
  4: "text-accent-4",
};

const accentCircle: Record<Accent, string> = {
  1: "border-accent-1/30 bg-accent-1/15 text-accent-1",
  2: "border-accent-2/30 bg-accent-2/15 text-accent-2",
  3: "border-accent-3/30 bg-accent-3/15 text-accent-3",
  4: "border-accent-4/30 bg-accent-4/15 text-accent-4",
};

export function Roadmap({ sections }: RoadmapProps) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((s, idx) => {
        const last = idx === sections.length - 1;
        return (
          <div key={s.label} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${accentCircle[s.accent]}`}
              >
                {s.icon ? <span aria-hidden>{s.icon}</span> : s.number}
              </div>
              {!last ? <div className="mt-2 w-px flex-1 min-h-[2rem] bg-border" aria-hidden /> : null}
            </div>
            <div className="pb-2">
              <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${accentLabel[s.accent]}`}>{s.label}</p>
              <h3 className="text-lg font-semibold text-fg">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
