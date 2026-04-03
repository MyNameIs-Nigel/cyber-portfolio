import type { ConsoleLogMessage } from "@/types";

export const thoughtLogTitle = "portfolio.log";

export const thoughtLogMessages: ConsoleLogMessage[] = [
  { timestamp: "[1652]", level: "INFO", text: "Nigel Smith's portfolio initialized successfully." },
  { timestamp: "[1653]", level: "DEBUG", text: "Found 3 projects in the projects folder." },
  { timestamp: "[1654]", level: "INFO", text: "Building portfolio with Next.js and Tailwind CSS." },  
  { timestamp: "[1655]", level: "INFO", text: "Vibe coding the next addition to the portfolio." },
  { timestamp: "[1656]", level: "WARN", text: "CI/CD pipeline: Deployment sucessful, but not yet deployed to production." },
  { timestamp: "[1657]", level: "ERROR", text: "UI bug found: Maybe you shouldn't vibe code as much?" },
];
