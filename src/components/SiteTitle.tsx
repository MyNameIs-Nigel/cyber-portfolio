export function SiteTitle() {
  return (
    <div className="mb-8 select-none font-mono">
      <span className="text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="text-accent-1">{">"}</span>
        <span className="ml-2 text-fg">nigel</span>
        <span className="text-muted">.</span>
        <span className="text-fg">smith</span>
        <span className="terminal-cursor ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] bg-accent-1" aria-hidden />
      </span>
    </div>
  );
}
