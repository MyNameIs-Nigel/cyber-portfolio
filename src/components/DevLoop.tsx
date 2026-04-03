const STEPS = [
  { emoji: "🧭", label: "Explore" },
  { emoji: "🔨", label: "Build" },
  { emoji: "🧪", label: "Test" },
  { emoji: "📦", label: "Ship" },
  { emoji: "🔁", label: "Reflect" },
] as const;

export function DevLoop() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm text-fg">
        {STEPS.map((s, i) => (
          <span key={s.label} className="inline-flex items-center gap-2">
            {i > 0 ? <span className="text-muted">→</span> : null}
            <span>
              {s.emoji} {s.label}
            </span>
          </span>
        ))}
        <span className="text-muted">→</span>
        <span className="text-muted" aria-hidden>
          ↺
        </span>
      </div>
      <p className="mt-4 text-center font-mono text-sm italic text-muted">
        Lorem ipsum dolor sit amet — iterate until the loop feels honest.
      </p>
    </div>
  );
}
