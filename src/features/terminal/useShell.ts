"use client";

import { useCallback, useState } from "react";
import { cloneNode, getMotdContent } from "@/features/terminal/baseImage";
import type { FsDir } from "@/features/terminal/shell.types";
import { completeLine } from "@/features/terminal/completion";
import { displayPath } from "@/features/terminal/filesystem";
import { runShellLine } from "@/features/terminal/executor";
import { HOSTNAME, MAX_HISTORY, MAX_INPUT_LEN, MAX_SCROLLBACK_LINES, USER } from "@/features/terminal/shell.constants";
import { truncateForDisplay } from "@/features/terminal/sanitize";
import { createInitialState } from "@/features/terminal/storage";
import type { OutputLine, ShellState } from "@/features/terminal/shell.types";

export type NavigateHandler = (href: string, delayMs: number) => void;

function pushScrollback(state: ShellState, lines: OutputLine[]) {
  state.scrollback.push(...lines);
  if (state.scrollback.length > MAX_SCROLLBACK_LINES) {
    state.scrollback.splice(0, state.scrollback.length - MAX_SCROLLBACK_LINES);
  }
}

function formatPrompt(state: ShellState): string {
  return `${USER}@${HOSTNAME}:${displayPath(state.cwd)}$ `;
}

export function useShell(onNavigate?: NavigateHandler) {
  const [state, setState] = useState<ShellState>(() => {
    const initial = createInitialState();
    pushScrollback(initial, [{ text: getMotdContent(initial.fs), variant: "normal" }]);
    return initial;
  });
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputLocked, setInputLocked] = useState(false);

  const appendOutput = useCallback((draft: ShellState, stdout: string, stderr: string, promptLine?: string) => {
    if (promptLine) {
      pushScrollback(draft, [{ text: promptLine, variant: "prompt" }]);
    }
    if (stdout) {
      pushScrollback(draft, [{ text: truncateForDisplay(stdout, 4000), variant: "normal" }]);
    }
    if (stderr) {
      pushScrollback(draft, [{ text: stderr, variant: "error" }]);
    }
  }, []);

  const runLine = useCallback(
    (raw: string) => {
      if (inputLocked) return;
      const trimmed = raw.trimEnd();
      setState((prev) => {
        const draft: ShellState = {
          ...prev,
          fs: cloneNode(prev.fs) as FsDir,
          vars: new Map(prev.vars),
          scrollback: [...prev.scrollback],
          history: [...prev.history],
        };
        const prompt = formatPrompt(draft);
        appendOutput(draft, "", "", `${prompt}${raw}`);

        if (trimmed) {
          draft.history.push(trimmed);
          if (draft.history.length > MAX_HISTORY) {
            draft.history.shift();
          }
        }

        const outcome = runShellLine(draft, trimmed);
        for (const r of outcome.results) {
          appendOutput(draft, r.stdout, r.stderr);
        }

        if (outcome.navigate && onNavigate) {
          pushScrollback(draft, [{ text: "Redirecting…\n", variant: "normal" }]);
          setInputLocked(true);
          onNavigate(outcome.navigate.href, outcome.navigate.delayMs);
        }

        return draft;
      });
      setHistoryIndex(-1);
    },
    [appendOutput, inputLocked, onNavigate],
  );

  const clearInput = useCallback(() => {
    setInput("");
    setHistoryIndex(-1);
  }, []);

  const onCtrlC = useCallback(
    (current: string) => {
      setState((prev) => {
        const draft = { ...prev, scrollback: [...prev.scrollback] };
        pushScrollback(draft, [{ text: `${formatPrompt(prev)}${current}^C`, variant: "prompt" }]);
        return draft;
      });
      clearInput();
    },
    [clearInput],
  );

  const historyUp = useCallback(() => {
    setState((prev) => {
      if (!prev.history.length) return prev;
      const nextIndex = historyIndex < 0 ? prev.history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(prev.history[nextIndex] ?? "");
      return prev;
    });
  }, [historyIndex]);

  const historyDown = useCallback(() => {
    setState((prev) => {
      if (historyIndex < 0) return prev;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= prev.history.length) {
        setHistoryIndex(-1);
        setInput("");
        return prev;
      }
      setHistoryIndex(nextIndex);
      setInput(prev.history[nextIndex] ?? "");
      return prev;
    });
  }, [historyIndex]);

  const completeTab = useCallback(
    (current: string) => {
      const result = completeLine(state, current, current.length);
      if (result.value !== current) {
        setInput(result.value);
        return;
      }
      if (result.options && result.options.length > 1) {
        setState((prev) => {
          const draft = { ...prev, scrollback: [...prev.scrollback] };
          pushScrollback(draft, [
            { text: `${formatPrompt(prev)}${current}`, variant: "prompt" },
            { text: result.options!.join("  "), variant: "normal" },
          ]);
          return draft;
        });
      }
    },
    [state],
  );

  const prompt = formatPrompt(state);

  return {
    scrollback: state.scrollback,
    input,
    setInput,
    prompt,
    title: `${USER}@${HOSTNAME}: ${displayPath(state.cwd)}`,
    runLine,
    onCtrlC,
    historyUp,
    historyDown,
    completeTab,
    maxInputLen: MAX_INPUT_LEN,
    inputLocked,
  };
}
