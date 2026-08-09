import type { KanbanColumn } from "@/types";

export const kanbanColumns: KanbanColumn[] = [
  {
    title: "Future Investigations",
    items: [
      { text: "Compare deployment patterns for small distributed systems.", tag: "Research", tagAccent: 1 },
      { text: "Build the same small tool in Go and Rust.", tag: "Language", tagAccent: 2 },
    ],
  },
  {
    title: "Lessons Learnt",
    items: [
      { text: "Measure before optimizing.", tag: "Philosophy", tagAccent: 3 },
      { text: "Small releases are easier to debug.", tag: "Process", tagAccent: 4 },
    ],
  },
];
