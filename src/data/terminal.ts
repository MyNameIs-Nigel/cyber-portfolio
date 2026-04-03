import type { TerminalRow } from "@/types";

export const terminalTitle = "nigel@portfolio ~ ps aux";

export const terminalHeaders = ["PID", "PROCESS", "STATUS", "MEM"];

export const terminalRows: TerminalRow[] = [
  { columns: ["3000", "next.js", "running", "128M"], statusColor: "accent-1" },
  { columns: ["6001", "byui", "in_class", "2G"], statusColor: "accent-3" },
  { columns: ["3001", "node", "running", "96M"], statusColor: "accent-1" },
  { columns: ["4102", "postgres", "running", "64M"], statusColor: "accent-1" },
  { columns: ["5120", "nigel", "living_the_dream", "null"], statusColor: "accent-4" },
  { columns: ["7003", "eslint", "sleeping", "48M"], statusColor: "accent-2" },
  { columns: ["8000", "tailwind", "running", "32M"], statusColor: "accent-1" },
];

export const terminalInput = {
  prompt: "$",
  command: "sudo docker run -it nigel/portfolio",
};
