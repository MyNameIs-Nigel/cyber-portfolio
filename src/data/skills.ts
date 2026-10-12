import type { SkillCategory } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    title: "Cloud & DevOps",
    accent: 1,
    items: [
      "AWS (IAM, EC2, RDS, S3, Lambda, VPC, Cognito)",
      "GCP (Firebase, IAM)",
      "AWS CloudFormation & IaC",
      "Docker & GitHub Actions (OIDC / AWS SSM)",
      "Vercel",
    ],
  },
  {
    title: "Languages & Scripting",
    accent: 2,
    items: [
      "PowerShell (M365/AD management)",
      "Bash",
      "Go",
      "Python",
      "JavaScript & TypeScript",
    ],
  },
  {
    title: "Infrastructure & Systems",
    accent: 3,
    items: [
      "Linux (Debian/Ubuntu)",
      "Windows Server",
      "Proxmox (CTs/VMs)",
      "M365 Admin, Exchange & Endpoint Management",
      "SQLite & Litestream",
    ],
  },
  {
    title: "Security & Networking",
    accent: 4,
    items: [
      "Cisco IOS",
      "Cloudflare DNS & Tunnels",
      "Wireshark, Nmap, Security Onion",
      "Fiber & Wireless Devices",
    ],
  },
];
