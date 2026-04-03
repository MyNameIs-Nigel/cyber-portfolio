import type { Project } from "@/types";

const base = "https://placehold.co/600x338/141414/737373?text=IMG";

export const projects: Project[] = [
  {
    title: "Full Coverage Technology",
    description: "Full Coverage Technology is a small business that provides technology solutions to small businesses.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://fullcoveragetechnology.com/",
    image: "/fct.png",
  },
  {
    title: "Photography Portfolio",
    description: "Side project to showcase my photography skills.",
    tags: ["Next.js", "Typescript", "Vercel"],
    link: "https://ndsironwood.com/",
    image: "/ndsironwood.png",
  },
  {
    title: "Grade Calculator",
    description: "A simple grade calculator to help me calculate my grades using Canvas API.",
    tags: ["Firebase", "HTML", "Canvas API"],
    link: "https://grades.ndsironwood.com/",
    image: "/grades.png",
  },
];
