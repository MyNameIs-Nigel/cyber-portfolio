"use client";

import { useCallback, useEffect, useRef } from "react";
import { useShell } from "@/features/terminal/useShell";

export function FakeShellApp() {
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
  } = useShell();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [scrollback]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      completeTab();
      return;
    }
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      runLine("clear");
      return;
    }
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      onCtrlC();
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
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border py-3 text-center text-sm text-muted">{title}</div>
      <div className="p-5 font-mono text-sm" onClick={focusInput} onKeyDown={undefined}>
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          className="h-[min(420px,60vh)] overflow-y-auto whitespace-pre-wrap break-words"
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
        <div className="mt-4 flex flex-wrap items-baseline">
          <span className="shrink-0 text-accent-1">{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, maxInputLen))}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            maxLength={maxInputLen}
            aria-label="Shell command input"
            className="min-w-0 flex-1 bg-transparent font-mono text-fg caret-transparent outline-none focus-visible:ring-2 focus-visible:ring-accent-1/50"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="terminal-cursor ml-0.5 inline-block h-[1em] w-[2px] bg-accent-1 align-[-0.15em]" aria-hidden />
        </div>
      </div>
    </div>
  );
}
