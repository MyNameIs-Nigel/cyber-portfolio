"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Matches Tailwind `md` (768px): viewports below are treated as mobile for this warning. */
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const SESSION_DISMISS_KEY = "portfolio-interactive-mobile-warning-dismissed";

export function InteractiveMobileWarningModal() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      /* private mode / quota */
    }
  }, []);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed) return;

    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const sync = () => {
      setOpen(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-200"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interactive-mobile-warning-title"
      aria-describedby="interactive-mobile-warning-desc"
    >
      <div className="relative mx-4 w-full max-w-md animate-[modalIn_0.2s_ease-out] rounded-xl border border-border bg-surface p-8 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-border/50 hover:text-fg"
          aria-label="Close warning"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="interactive-mobile-warning-title" className="pr-10 text-xl font-semibold text-accent-2">
          Warning
        </h2>
        <p id="interactive-mobile-warning-desc" className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-fg">WARNING!</span> interactive experiences are designed for use on desktop browsers, this game
          will likely not work on mobile!
        </p>

        <p className="mt-6 text-center text-xs text-muted">
          Press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
