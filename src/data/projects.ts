import type { Project } from "@/types";


export const projects: Project[] = [
  {
    slug: "full-coverage-technology",
    title: "Full Coverage Technology",
    description: "Full Coverage Technology is a small business that provides technology solutions to small businesses.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://fullcoveragetechnology.com/",
    image: "/projects/fct-1.png",
    preview: { mode: "live", url: "https://fullcoveragetechnology.com/", previewWidth: 1280 },
    screenshots: ["/projects/fct-1.png", "/projects/fct-2.png", "/projects/fct-3.png"],
    content: [
      "Full Coverage Technology is a small business that provides technology solutions to small businesses. I built this website to showcase their services and get them online.",
      "I used Next.js and TypeScript for structure and type safety, deployed on Vercel for previews and production. Content and imagery are easy to swap as the business evolves.",
      "Next steps could include a lightweight CMS or blog if the team wants to publish updates without touching code.",
    ],
    demoUrl: "https://fullcoveragetechnology.com/",
  },
  {
    slug: "photography-portfolio",
    title: "Photography Portfolio",
    description: "Side project to showcase my photography skills.",
    tags: ["Next.js", "Typescript", "Vercel"],
    link: "https://ndsironwood.com/",
    image: "/projects/nds-1.png",
    preview: { mode: "live", url: "https://ndsironwood.com/", previewWidth: 1280 },
    screenshots: ["/projects/nds-1.png", "/projects/nds-2.png", "/projects/nds-3.png"],
    content: [
      "This portfolio showcases photography work in a minimal, image-first layout. The goal was to keep attention on the photos while still providing context and navigation that feels natural on phone and desktop.",
      "Built with Next.js and TypeScript and hosted on Vercel. Image-heavy routes use responsive loading so visitors aren't waiting on huge assets upfront.",
      "The site doubles as a playground for refining typography, spacing, and subtle motion without overpowering the art.",
    ],
    demoUrl: "https://ndsironwood.com/",
    repoUrl: "https://github.com/mynameis-nigel/nextjs-portfolio",
  },
  {
    slug: "grade-calculator",
    title: "Grade Calculator",
    description: "A simple grade calculator to help me calculate my grades using Canvas API.",
    tags: ["Firebase", "HTML", "Canvas API"],
    link: "https://grades.ndsironwood.com/",
    image: "/projects/grades-1.png",
    screenshots: ["/projects/grades-1.png", "/projects/grades-2.png", "/projects/grades-3.png"],
    content: [
      "A practical tool that pulls course data via the Canvas API and helps estimate where grades stand across assignments. It started as a personal utility and might grow into something I could share with classmates.",
      "The front end is straightforward HTML and client-side logic; Firebase backs auth or persistence where needed. Handling API quirks and edge cases (dropped grades, weighting) was the interesting part.",
      "If I revisit it, I'd add clearer onboarding for API keys and stronger error messaging when Canvas changes behavior.",
    ],
    demoUrl: "https://grades.ndsironwood.com/",
    repoUrl: "https://github.com/mynameis-nigel/firebase-grades",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
