import type { SkillCategory } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    title: "Cloud & DevOps",
    accent: 1,
    items: [
      "AWS (IAM, EC2, RDS, S3, Lambda, VPC, Cognito)",
      "GCP (Firebase, IAM, Vertex AI)",
      "AWS CloudFormation & IaC",
      "CI/CD Pipelines",
    ],
  },
  {
    title: "Languages & Scripting",
    accent: 2,
    items: [
      "Python (APIs, data pipelines, automation)",
      "PowerShell (M365/AD management)",
      "Bash",
    ],
  },
  {
    title: "Infrastructure & Systems",
    accent: 3,
    items: [
      "Linux (Debian/Ubuntu)",
      "Windows Server 2016/2022/2025",
      "Proxmox (CTs/VMs)",
      "M365 Admin",
    ],
  },
  {
    title: "Security & Networking",
    accent: 4,
    items: [
      "Cisco Devices",
      "Cloudflare DNS & Tunnels",
      "Wireshark · Nmap · SecurityOnion",
      "Ubiquiti · Cambium · Tarana Radios",
    ],
  },
];
