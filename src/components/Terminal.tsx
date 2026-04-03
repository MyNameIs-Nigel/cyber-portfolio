import type { TerminalProps, TerminalRow } from "@/types";

function statusDotClass(color?: TerminalRow["statusColor"]) {
  switch (color) {
    case "accent-2":
      return "bg-accent-2";
    case "accent-3":
      return "bg-accent-3";
    case "accent-4":
      return "bg-accent-4";
    case "red":
      return "bg-red-500";
    case "accent-1":
    default:
      return "bg-accent-1";
  }
}

export function Terminal({ title, rows, columnHeaders, input }: TerminalProps) {
  const colCount = columnHeaders?.length ?? (rows[0]?.columns.length ?? 1);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {title ? (
        <div className="border-b border-border py-3 text-center text-sm text-muted">{title}</div>
      ) : null}
      <div className="p-5 font-mono text-sm">
        {columnHeaders?.length ? (
          <div
            className="mb-3 grid gap-3 text-xs uppercase tracking-wider text-muted"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
          >
            {columnHeaders.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        ) : null}
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: `repeat(${row.columns.length}, minmax(0, 1fr))` }}
            >
              {row.columns.map((cell, j) => {
                const isLast = j === row.columns.length - 1;
                const isProcess = j === 1;
                const isStatus = j === 2;
                const textClass = isProcess ? "font-medium text-accent-1" : isLast ? "text-muted" : "text-fg";
                return (
                  <span key={j} className={textClass}>
                    {isStatus ? (
                      <span className="inline-flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDotClass(row.statusColor)}`} aria-hidden />
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {input ? (
          <div className="mt-4 flex flex-wrap items-baseline">
            <span className="text-accent-1">{input.prompt}</span>
            <span className="text-fg">{input.command}</span>
            <span className="terminal-cursor ml-0.5 inline-block h-[1em] w-[2px] bg-accent-1 align-[-0.15em]" aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  );
}
