import type { ReactNode } from "react";

export function QuoteBlock({ children, attribution }: { children: ReactNode; attribution?: string }) {
  return (
    <blockquote className="border-l-2 border-accent-1 py-1 pl-4">
      <p className="text-sm italic leading-relaxed text-muted">{children}</p>
      {attribution ? <footer className="mt-2 text-xs text-muted not-italic">{attribution}</footer> : null}
    </blockquote>
  );
}
