import type { Project } from "@/types";


export const projects: Project[] = [
  {
    slug: "photography-portfolio",
    title: "Photography Portfolio",
    description: "A home for my film and digital photography.",
    tags: ["Next.js", "Typescript", "Vercel"],
    link: "https://ndsironwood.com/",
    image: "/projects/nds-1.png",
    preview: { mode: "live", url: "https://ndsironwood.com/", previewWidth: 1024 },
    screenshots: ["/projects/nds-1.png", "/projects/nds-2.png", "/projects/nds-3.png"],
    content: [
      "I kept the layout quiet so the photos do most of the work. Galleries are easy to browse on a phone or desktop, with just enough context around each set.",
      "The main technical challenge was keeping image-heavy pages quick. Responsive image sizes avoid loading the largest file when a smaller one will do.",
    ],
    demoUrl: "https://ndsironwood.com/",
    repoUrl: "https://github.com/mynameis-nigel/nextjs-portfolio",
  },
  {
    slug: "full-coverage-technology",
    title: "Full Coverage Technology",
    description: "A marketing site for a small-business IT provider.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://fullcoveragetechnology.com/",
    image: "/projects/fct-1.png",
    preview: { mode: "live", url: "https://fullcoveragetechnology.com/", previewWidth: 1024 },
    screenshots: ["/projects/fct-1.png", "/projects/fct-2.png", "/projects/fct-3.png"],
    content: [
      "I built Full Coverage Technology's first website to explain what the company does and give prospective clients a straightforward way to get in touch.",
      "The service pages use plain language and a simple structure. Content and images can be changed without rebuilding the layout as the business adds new offerings.",
    ],
    demoUrl: "https://fullcoveragetechnology.com/",
  },
  {
    slug: "tz-digital",
    title: "TZ Digital Advisors",
    description: "A website for an independent IT advisory firm in Athens, Georgia.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://tz-digital.com/",
    preview: { mode: "live", url: "https://tz-digital.com/", previewWidth: 1024 },
    screenshots: ["/projects/tz-1.png", "/projects/tz-2.png", "/projects/tz-3.png"],
    content: [
      "TZ Digital Advisors has more than 25 years of enterprise IT experience across 15 countries. I built the site around the firm's five service areas and its vendor-independent approach.",
      "The design is restrained and direct: explain the work, establish the firm's experience, and make it easy to request a consultation.",
    ],
    demoUrl: "https://tz-digital.com/",
  },
  {
    slug: "ssharcade",
    title: "SSH Arcade",
    description: "Terminal games you can play over SSH, with nothing to install.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://ssharcade.dev/",
    preview: { mode: "live", url: "https://ssharcade.dev/", previewWidth: 1024 },
    screenshots: ["/projects/arcade-1.png", "/projects/arcade-2.png", "/projects/arcade-3.png"],
    content: [
      "SSH Arcade started with one idea: copy an SSH command and land directly in a game. There is no account, launcher, or client to install.",
      "The website lists the available games and gives each one a command visitors can paste into a terminal.",
      "The first live game is Farm, an idle-style farming game. Moon Mine and Packet Derby are in development. The open-source repo backs the website content; the game server infrastructure lives separately.",
    ],
    demoUrl: "https://ssharcade.dev/",
    repoUrl: "https://github.com/mynameIs-Nigel/ssharcade-web",
  },
  {
    slug: "walton-tax-professionals",
    title: "Walton Tax Professionals",
    description: "A website for a CPA firm handling complex individual and small-business taxes.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://www.waltontaxpro.com/",
    image: "/projects/wtp-1.png",
    preview: { mode: "live", url: "https://www.waltontaxpro.com/", previewWidth: 1024 },
    screenshots: ["/projects/wtp-1.png", "/projects/wtp-2.png", "/projects/wtp-3.png"],
    content: [
      "Walton Tax Professionals is a Monroe, Georgia CPA firm serving clients nationwide. Its focus includes multi-state income, investments, real estate, equity compensation, and entity taxation.",
      "I organized the site around the questions tax clients usually have first: whether the firm handles their situation, what it costs, and how to start.",
    ],
    demoUrl: "https://www.waltontaxpro.com/",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
