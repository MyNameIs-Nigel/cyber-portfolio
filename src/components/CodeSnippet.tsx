import type { ReactNode } from "react";
import type { CodeSnippetProps } from "@/types";

const KEYWORDS = new Set(["function", "if", "return", "const", "let", "export", "async", "await", "import", "from"]);

function colorizeLine(text: string): ReactNode {
  const token =
    /(\s+)|("[^"]*")|('[^']*')|(`[^`]*`)|(\b[a-zA-Z_$][\w$]*\b)|([(){}\[\];,.])/g;
  const parts: ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(token.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, m.index)}</span>);
    }
    const chunk = m[0];
    if (/^\s+$/.test(chunk)) {
      parts.push(<span key={key++}>{chunk}</span>);
    } else if (/^["'`]/.test(chunk)) {
      parts.push(
        <span key={key++} className="text-accent-1">
          {chunk}
        </span>,
      );
    } else if (KEYWORDS.has(chunk)) {
      parts.push(
        <span key={key++} className="text-accent-3">
          {chunk}
        </span>,
      );
    } else if (m[6] && /^[(){}\[\];,.]$/.test(chunk)) {
      parts.push(<span key={key++}>{chunk}</span>);
    } else if (m[5]) {
      const next = text.slice(re.lastIndex).trimStart();
      const isFn = next.startsWith("(");
      parts.push(
        <span key={key++} className={isFn ? "text-accent-2" : "text-fg"}>
          {chunk}
        </span>,
      );
    } else {
      parts.push(<span key={key++}>{chunk}</span>);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return parts;
}

export function CodeSnippet({ filename, theme, lines }: CodeSnippetProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-3 text-sm text-muted">
        <span className="text-fg">{filename}</span>
        {theme ? <span className="ml-2 text-muted">{theme}</span> : null}
      </div>
      <div className="space-y-1 p-5 font-mono text-sm">
        {lines.map((line, i) => (
          <div key={i} className="flex flex-wrap gap-x-4">
            <div className="min-w-0 flex-1" style={{ paddingLeft: `${line.indent * 1}rem` }}>
              {colorizeLine(line.text)}
            </div>
            {line.annotation ? (
              <span className="shrink-0 text-xs italic text-muted max-sm:w-full max-sm:pl-0">{line.annotation}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
