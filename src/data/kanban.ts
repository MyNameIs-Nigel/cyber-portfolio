import type { KanbanColumn } from "@/types";

export const kanbanColumns: KanbanColumn[] = [
  {
    title: "Future Investigations",
    items: [
      { text: "Lorem ipsum research thread on distributed systems.", tag: "Research", tagAccent: 1 },
      { text: "Dolor sit amet language runtime comparisons.", tag: "Language", tagAccent: 2 },
    ],
  },
  {
    title: "Lessons Learnt",
    items: [
      { text: "Consectetur adipiscing — measure before optimizing.", tag: "Philosophy", tagAccent: 3 },
      { text: "Sed do eiusmod — small releases reduce risk.", tag: "Process", tagAccent: 4 },
    ],
  },
];
