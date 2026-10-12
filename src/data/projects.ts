import type { Project } from "@/types";

/**
 * The featured web apps, in display order. Each slug has a dedicated page at
 * `src/app/projects/<slug>/page.tsx` — `projects.test.ts` fails the build if one
 * is missing. Screenshots are 2400×1600 quality-80 JPEGs under `public/projects/<folder>/`.
 */
export const projects: Project[] = [
  {
    slug: "ndsironwood",
    title: "Photography Portfolio",
    description: "A home for my film and digital photography.",
    tags: ["Next.js", "TypeScript", "Cloudflare R2", "Vercel"],
    link: "https://www.ndsironwood.com/",
    image: "/projects/ndsironwood/hero.jpg",
    preview: { mode: "live", url: "https://www.ndsironwood.com/", previewWidth: 1024 },
    screenshots: [
      "/projects/ndsironwood/hero.jpg",
      "/projects/ndsironwood/portfolio.jpg",
      "/projects/ndsironwood/photos.jpg",
      "/projects/ndsironwood/expanded.jpg",
    ],
    content: [
      "I kept the layout quiet so the photos do most of the work. Galleries are easy to browse on a phone or desktop, with just enough context around each set.",
      "The photo journal on /photos is served from Cloudflare R2 rather than bundled with the site, so adding photos does not mean redeploying it.",
    ],
    repoUrl: "https://github.com/mynameis-nigel/nextjs-portfolio",
  },
  {
    slug: "ssharcade",
    title: "SSH Arcade Website",
    description: "The browser front door to SSH Arcade, with live player counts for each terminal game.",
    tags: ["Next.js", "Caddy", "Vercel"],
    link: "https://www.ssharcade.dev/",
    image: "/projects/arcade/hero.jpg",
    preview: { mode: "live", url: "https://www.ssharcade.dev/", previewWidth: 1024 },
    screenshots: [
      "/projects/arcade/hero.jpg",
      "/projects/arcade/games.jpg",
      "/projects/arcade/moon-miner.jpg",
    ],
    content: [
      "The website is hosted on Vercel, while the apex domain points at the game host. Caddy on that host redirects web visitors from ssharcade.dev to www.ssharcade.dev, which leaves the bare domain free for players to type ssh ssharcade.dev.",
    ],
  },
  {
    slug: "bus321",
    title: "BUS 321 Goal Tracker",
    description: "A daily goal tracker for a class, where teammates check in on each other's progress.",
    tags: ["Next.js", "Google OIDC", "Neon PostgreSQL", "Vercel"],
    link: "https://bus321.nigel-smith.dev/",
    image: "/projects/bus321/today-dark.jpg",
    preview: { mode: "live", url: "https://bus321.nigel-smith.dev/", previewWidth: 1024 },
    screenshots: [
      "/projects/bus321/today-dark.jpg",
      "/projects/bus321/history-dark.jpg",
      "/projects/bus321/export-dark.jpg",
    ],
    content: [
      "Students sign in with Google over OIDC, which is also how the app manages who is on each team. The data lives in Neon PostgreSQL, provisioned through Vercel.",
    ],
  },
  {
    slug: "full-coverage-technology",
    title: "Full Coverage Technology",
    description: "A marketing site for a small-business IT provider.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://www.fullcoveragetechnology.com/",
    image: "/projects/fct/hero.jpg",
    preview: { mode: "live", url: "https://www.fullcoveragetechnology.com/", previewWidth: 1024 },
    screenshots: [
      "/projects/fct/hero.jpg",
      "/projects/fct/services.jpg",
      "/projects/fct/team.jpg",
      "/projects/fct/team-nigel.jpg",
    ],
    content: [
      "I built Full Coverage Technology's first website to explain what the company does and give prospective clients a straightforward way to get in touch.",
      "The service pages use plain language and a simple structure. Content and images can be changed without rebuilding the layout as the business adds new offerings.",
    ],
  },
];

/**
 * Lookup for the dedicated project pages. Each page names its own slug, so an
 * unknown one is a typo to fail the build on rather than a 404 to serve.
 */
export function getProjectBySlug(slug: string): Project {
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    throw new Error(`No project with slug "${slug}" in src/data/projects.ts`);
  }
  return project;
}
