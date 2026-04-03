"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

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
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Contact information"
    >
      <div className="relative mx-4 w-full max-w-md animate-[modalIn_0.2s_ease-out] rounded-xl border border-border bg-surface p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-border/50 hover:text-fg"
          aria-label="Close contact card"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-fg">Get in touch</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          I'd love to hear from you! Reach out through any of these channels.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-1/10 text-accent-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-muted">Email</p>
              <Link
                href="mailto:nigel.nds.smith@gmail.com"
                className="text-sm font-medium text-accent-1 transition-colors duration-200 hover:text-accent-2"
              >
                nigel.nds.smith@gmail.com
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-3/10 text-accent-3">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-muted">GitHub</p>
              <Link
                href="https://github.com/mynameis-nigel/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-fg transition-colors duration-200 hover:text-accent-1"
              >
                github.com/MyNameIs-Nigel
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-2/10 text-accent-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-muted">LinkedIn</p>
              <Link
                href="https://www.linkedin.com/in/nigeld-smith/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-fg transition-colors duration-200 hover:text-accent-1"
              >
                linkedin.com/in/nigeld-smith
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
