import type { RoadmapSection } from "@/types";
import { profile } from "@/data/profile";

export const roadmapSections: RoadmapSection[] = [
  {
    label: "NOW",
    accent: 1,
    title: "B.S. Cybersecurity @ BYU-Idaho",
    description: `Finishing my cybersecurity degree (${profile.education.graduation.replace("Expected", "expected")}) while working in security and infrastructure at Fybercom.`,
    number: 1,
  },
  {
    label: "NEXT",
    accent: 2,
    title: profile.certificationStudy[0].name,
    description: "Building on the SOC coursework with a hands-on analyst certification.",
    number: 2,
  },
  {
    label: "FUTURE",
    accent: 3,
    title: "DevSecOps Engineer",
    description: "Keep growing toward work where security, automation, and CI/CD meet.",
    number: 3,
    icon: "▼",
  },
];
