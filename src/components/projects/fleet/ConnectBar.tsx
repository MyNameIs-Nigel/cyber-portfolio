"use client";

import { useEffect, useRef, useState } from "react";

const RESET_MS = 2000;

/**
 * The connect string, at the size of the thing that matters most on the page.
 *
 * One command with a copy button rather than a link, because there is nothing to
 * click through to — the arcade is not a web app and the whole point of the
 * section is that the address bar is not involved.
 *
 * Copy failures are not swallowed silently: if the clipboard is unavailable the
 * label says so, and the command is selectable text either way.
 */
export function ConnectBar({ command, note }: { command: string; note: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), RESET_MS);
  };

  return (
    <div>
      <div className="flex items-stretch gap-2 rounded-xl border border-accent-1/30 bg-surface p-2 sm:p-2.5">
        <p className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-2 font-mono text-sm text-fg sm:text-base">
          <span aria-hidden className="shrink-0 text-accent-1">
            $
          </span>
          <span className="whitespace-nowrap">{command}</span>
        </p>

        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-border bg-band px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/70 transition-colors duration-200 hover:border-accent-1/50 hover:text-accent-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-band"
        >
          {state === "copied" ? "copied" : state === "failed" ? "copy failed" : "copy"}
        </button>
      </div>

      {/* The button's own label changes, so the announcement lives beside it rather than in it. */}
      <p aria-live="polite" className="sr-only">
        {state === "copied" ? "Command copied to clipboard" : state === "failed" ? "Could not copy — select the command instead" : ""}
      </p>

      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted">{note}</p>
    </div>
  );
}
