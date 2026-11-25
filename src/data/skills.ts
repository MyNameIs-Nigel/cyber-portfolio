import type { SkillCategory } from "@/types";

/** Shown as cards on the home page, two to a row, in this order. */
export const skillCategories: SkillCategory[] = [
  {
    title: "Cloud & DevOps",
    accent: 1,
    items: [
      "AWS (EC2, S3, RDS, IAM, VPC, Lambda, SSM)",
      "GitHub Actions with OIDC deploys to AWS",
      "Docker & GitHub Container Registry",
      "CloudFormation (infrastructure as code)",
      "GCP (Firebase, IAM, Vertex AI)",
      "Vercel & Cloudflare",
    ],
  },
  {
    title: "AI & Automation",
    accent: 2,
    items: [
      "n8n workflows, self-hosted",
      "LLM APIs through OpenRouter",
      "Local models with Ollama",
      "Claude Code & custom MCP servers",
      "Cursor",
    ],
  },
  {
    title: "Infrastructure & Systems",
    accent: 3,
    items: [
      "Proxmox VE (VMs & LXC containers)",
      "Linux (Debian/Ubuntu)",
      "Windows Server & Active Directory",
      "TrueNAS",
      "M365 & Exchange administration",
      "SQLite & Litestream",
    ],
  },
  {
    title: "Security",
    accent: 4,
    items: [
      "Pull request security review",
      "CVE monitoring & patching",
      "Container hardening (non-root, read-only, dropped capabilities)",
      "Wireshark, Nmap, Security Onion",
      "Cloudflare Zero Trust",
    ],
  },
  {
    title: "Networking",
    accent: 1,
    items: [
      "VLAN design & segmentation",
      "Cisco IOS",
      "Cloudflare DNS & Tunnels",
      "Fiber & fixed wireless (Tarana, Cambium, Ubiquiti)",
    ],
  },
  {
    title: "Languages & Scripting",
    accent: 2,
    items: [
      "Go",
      "Python",
      "TypeScript & JavaScript",
      "Bash",
      "PowerShell (M365 & AD administration)",
      "C#",
    ],
  },
];
