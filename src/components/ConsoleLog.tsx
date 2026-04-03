import type { ConsoleLogProps, LogLevel } from "@/types";

const levelClass: Record<LogLevel, string> = {
  INFO: "text-accent-1",
  WARN: "text-accent-2",
  ERROR: "text-red-500",
  DEBUG: "text-accent-3",
};

export function ConsoleLog({ title, messages }: ConsoleLogProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {title ? (
        <div className="border-b border-border py-3 text-center text-sm text-muted">{title}</div>
      ) : null}
      <div className="space-y-2 p-5 font-mono text-sm">
        {messages.map((m, i) => (
          <div key={i} className="flex flex-wrap gap-x-2 gap-y-1">
            {m.timestamp ? <span className="text-muted">{m.timestamp}</span> : null}
            <span className={levelClass[m.level]}>[{m.level}]</span>
            <span className="text-fg">{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
