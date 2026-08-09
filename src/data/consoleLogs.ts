import type { ConsoleLogMessage } from "@/types";

export const thoughtLogTitle = "portfolio.log";

export const thoughtLogMessages: ConsoleLogMessage[] = [
  { timestamp: "[1652]", level: "INFO", text: "Portfolio booted. No production servers were harmed." },
  { timestamp: "[1653]", level: "DEBUG", text: "Found another side project. Opened a new tab." },
  { timestamp: "[1654]", level: "INFO", text: "Photos optimized. Film grain left intact." },
  { timestamp: "[1655]", level: "WARN", text: "README is three commits behind the code." },
  { timestamp: "[1656]", level: "INFO", text: "Build passed. Suspicious, but acceptable." },
  { timestamp: "[1657]", level: "ERROR", text: "One more idea added to the backlog." },
];
