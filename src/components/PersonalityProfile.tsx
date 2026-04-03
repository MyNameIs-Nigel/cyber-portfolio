import type { Accent, PersonalityProfileProps } from "@/types";

const barBg: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

const barTrack: Record<Accent, string> = {
  1: "bg-accent-1/20",
  2: "bg-accent-2/20",
  3: "bg-accent-3/20",
  4: "bg-accent-4/20",
};

const textAccent: Record<Accent, string> = {
  1: "text-accent-1",
  2: "text-accent-2",
  3: "text-accent-3",
  4: "text-accent-4",
};

export function PersonalityProfile({ type, title, traits, role, strategy }: PersonalityProfileProps) {
  return (
    <div>
      <p className="font-mono text-3xl font-bold text-accent-1">{type}</p>
      <p className="text-muted">{title}</p>
      <div className="mt-6 space-y-6">
        {traits.map((t) => {
          const accent = t.accent ?? 1;
          const isLeft = t.percentage >= 50;
          const fillPct = isLeft ? t.percentage : 100 - t.percentage;
          return (
            <div key={t.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-xs uppercase tracking-wider text-muted">{t.label}</span>
              </div>
              <div className={`relative h-2.5 overflow-hidden rounded-full ${barTrack[accent]}`}>
                <div
                  className={`absolute top-0 h-full rounded-full ${barBg[accent]} transition-all duration-300`}
                  style={
                    isLeft
                      ? { left: 0, width: `${fillPct}%` }
                      : { right: 0, width: `${fillPct}%` }
                  }
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-px bg-border/60" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className={`text-xs font-medium ${isLeft ? textAccent[accent] : "text-muted"}`}>
                  {t.value}
                </span>
                <span className={`font-mono text-xs ${textAccent[accent]}`}>
                  {t.percentage}%
                </span>
              </div>
              {t.description ? (
                <p className="mt-1 text-sm text-muted">{t.description}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      {(role || strategy) && (
        <div className="mt-8 space-y-4 border-t border-border pt-6">
          {role ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">{role.title}</p>
              <p className="mt-1 text-sm text-fg">{role.description}</p>
            </div>
          ) : null}
          {strategy ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">{strategy.title}</p>
              <p className="mt-1 text-sm text-fg">{strategy.description}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
