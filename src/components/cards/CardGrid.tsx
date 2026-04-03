import type { ReactNode } from "react";

const gapMap = { sm: "gap-2", md: "gap-3" } as const;
const colMap = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3" } as const;

export function CardGrid({
  columns = 2,
  gap = "md",
  children,
  className = "",
}: {
  columns?: 2 | 3;
  gap?: "sm" | "md";
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid ${colMap[columns]} ${gapMap[gap]} ${className}`.trim()}>{children}</div>;
}
