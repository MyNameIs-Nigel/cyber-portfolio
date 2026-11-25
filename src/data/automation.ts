import type { Accent } from "@/types";

/**
 * Automation and AI workflow projects for /projects#automation.
 *
 * These run on my own hardware or accounts, so there is no public page to link
 * to. Each entry says plainly whether it is in daily use or still being built.
 */
export interface AutomationProject {
  title: string;
  status: "in-use" | "in-progress";
  description: string;
  tags: string[];
  accent: Accent;
}

export const automationProjects: AutomationProject[] = [
  {
    title: "Calendar MCP server",
    status: "in-use",
    description:
      "A self-hosted app at schedule.nigel-smith.dev that merges all of my Google Calendars into one agenda. I exposed it to Claude as a custom MCP server, so an assistant reads my whole week in one call instead of querying each calendar separately.",
    tags: ["Next.js", "SQLite", "Drizzle", "MCP"],
    accent: 1,
  },
  {
    title: "Email triage with n8n",
    status: "in-progress",
    description:
      "A self-hosted n8n workflow that picks up new mail from Gmail and Outlook and has a language model, reached through OpenRouter, label each message by priority, likely spam, and type.",
    tags: ["n8n", "OpenRouter", "Gmail", "Outlook"],
    accent: 2,
  },
  {
    title: "Private document reader",
    status: "in-progress",
    description:
      "An n8n pipeline for tax paperwork that runs OCR and language models on local hardware and turns scans, including handwritten ones, into clean Markdown. The documents are sensitive, so nothing leaves the network, and the plan is to run two models side by side and flag where they disagree.",
    tags: ["n8n", "OCR", "Local LLMs", "Markdown"],
    accent: 3,
  },
  {
    title: "Smithnet homelab",
    status: "in-use",
    description:
      "A three-node Proxmox cluster on a segmented network, with separate VLANs for infrastructure, self-hosted apps, smart-home devices, and a dev sandbox. It runs TrueNAS storage, a Windows domain controller, Home Assistant, local models on Ollama, and a self-hosted GitHub Actions runner.",
    tags: ["Proxmox", "VLANs", "TrueNAS", "Ollama", "GitHub Actions"],
    accent: 4,
  },
];
