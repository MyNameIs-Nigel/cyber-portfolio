"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useShell, type NavigateHandler } from "@/features/terminal/useShell";

export function FakeShellApp() {
  const router = useRouter();
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onNavigate: NavigateHandler = useCallback(
    (href, delayMs) => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
      navigateTimerRef.current = setTimeout(() => {
        router.push(href);
      }, delayMs);
    },
    [router],
  );

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
    };
  }, []);

  const {
    scrollback,
    input,
    setInput,
    prompt,
    title,
    runLine,
    onCtrlC,
    historyUp,
    historyDown,
    completeTab,
    maxInputLen,
    inputLocked,
  } = useShell(onNavigate);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollback]);

  const focusInput = useCallback(() => {
    if (!inputLocked) {
      inputRef.current?.focus();
    }
  }, [inputLocked]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (inputLocked) return;
    if (e.key === "Enter") {
      e.preventDefault();
      runLine(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      historyUp();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      historyDown();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      completeTab(input);
      return;
    }
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      runLine("clear");
      return;
    }
    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      onCtrlC(input);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.length > maxInputLen) {
      e.preventDefault();
      setInput(text.slice(0, maxInputLen));
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/20">
      <div className="relative flex items-center justify-center border-b border-border px-4 py-3">
        <div className="absolute left-4 flex items-center gap-2" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-accent-2/70" />
          <span className="h-3 w-3 rounded-full bg-accent-1/70" />
        </div>
        <span className="truncate font-mono text-xs text-muted sm:text-sm">{title}</span>
      </div>

      <div className="p-5 font-mono text-sm" onClick={focusInput}>
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
          className="terminal-scroll h-[min(420px,60vh)] overflow-y-auto whitespace-pre-wrap break-words leading-relaxed"
        >
          {scrollback.map((line, i) => (
            <div
              key={i}
              className={
                line.variant === "error"
                  ? "text-red-400"
                  : line.variant === "prompt"
                    ? "text-accent-1"
                    : "text-fg"
              }
            >
              {line.text}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-baseline border-t border-border/40 pt-3">
          <span className="shrink-0 whitespace-pre text-accent-1">{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={inputLocked}
            onChange={(e) => setInput(e.target.value.slice(0, maxInputLen))}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            maxLength={maxInputLen}
            aria-label="Shell command input"
            className="min-w-0 flex-1 bg-transparent font-mono text-fg caret-accent-1 outline-none disabled:opacity-50"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
