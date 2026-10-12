import type { RoadmapSection } from "@/types";
import { profile } from "@/data/profile";

export const roadmapSections: RoadmapSection[] = [
  {
    label: "NOW",
    accent: 1,
    title: "B.S. Cybersecurity @ BYU-Idaho",
    description: `Finishing my cybersecurity degree (${profile.education.graduation.replace("Expected", "expected")}) while working in network support and building cloud projects.`,
    number: 1,
  },
  {
    label: "NEXT",
    accent: 2,
    title: profile.certificationStudy.name,
    description: profile.certificationStudy.description,
    number: 2,
  },
  {
    label: "FUTURE",
    accent: 3,
    title: "Cloud Security / DevSecOps Engineer",
    description: "Move into a role focused on infrastructure automation and cloud security.",
    number: 3,
    icon: "▼",
  },
];
