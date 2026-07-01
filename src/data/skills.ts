import type { SkillCategory } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    title: "Cloud & DevOps",
    accent: 1,
    items: [
      "AWS (EC2, RDS, S3, Lambda, VPC, Cognito)",
      "GCP (Firebase, IAM)",
      "AWS CloudFormation & IaC",
      "CI/CD Pipelines",
    ],
  },
  {
    title: "Languages & Scripting",
    accent: 2,
    items: [
      "PowerShell (M365/AD management)",
      "Bash",
      "Python (APIs)",
      "C#",
    ],
  },
  {
    title: "Infrastructure & Systems",
    accent: 3,
    items: [
      "Linux (Various Distros)",
      "Windows Server 2016/2022/2025",
      "Proxmox (CTs/VMs)",
      "M365 Admin",
    ],
  },
  {
    title: "Security & Networking",
    accent: 4,
    items: [
      "Cisco & Aruba Devices",
      "Cloudflare DNS & Tunnels",
      "Wireshark, Nmap, SecurityOnion",
      "Fiber & Wireless Devices",
    ],
  },
];
