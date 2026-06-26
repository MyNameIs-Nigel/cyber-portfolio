import type { Project } from "@/types";


export const projects: Project[] = [
  {
    slug: "tz-digital",
    title: "TZ Digital Advisors",
    description: "TZ Digital Advisors is a boutique enterprise IT consulting firm based in Athens, GA, offering vendor-agnostic technology advisory services to businesses of all sizes.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://tz-digital.com/",
    preview: { mode: "live", url: "https://tz-digital.com/", previewWidth: 1024 },
    screenshots: ["/projects/tz-1.png", "/projects/tz-2.png", "/projects/tz-3.png"],
    content: [
      "TZ Digital Advisors is an Athens, Georgia IT consulting firm with 25+ years of enterprise leadership experience across 15+ countries. Their practice spans five areas — Data Center & Cloud, Collaboration Platforms, End-User Compute, Networking, and Helpdesk — with a vendor-agnostic philosophy: no stack to resell, just the right fit for the client. I built this website to introduce the firm, articulate their service model, and drive prospective clients toward a consultation.",
      "Built with Next.js and TypeScript, deployed on Vercel. The design leans into the firm's positioning as a senior-level, operations-focused practice — clean and direct, with clear service descriptions and a strong call-to-action rather than feature bloat.",
      "Next steps could include a case study section or blog to demonstrate the firm's expertise in practice and improve organic search visibility.",
    ],
    demoUrl: "https://tz-digital.com/",
  },
  {
    slug: "ssharcade",
    title: "SSH Arcade",
    description: "A retro-future arcade platform delivering terminal games playable entirely through SSH connections — no downloads, no installs, just SSH in and play.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://ssharcade.dev/",
    preview: { mode: "live", url: "https://ssharcade.dev/", previewWidth: 1024 },
    screenshots: ["/projects/arcade-1.png", "/projects/arcade-2.png", "/projects/arcade-3.png"],
    content: [
      "SSH Arcade is a retro-future arcade platform where every game runs in your terminal over SSH. The pitch is dead simple: copy a command, paste it, play. No client software, no sign-up, no friction — just the way arcade machines used to work, except the coin is an SSH handshake.",
      "The marketing site is built with Next.js and TypeScript, deployed on Vercel. It serves as the front door for the platform — introducing the concept, showcasing available game cabinets, and linking players to the SSH commands that drop them straight into a game session.",
      "The first live game is Farm, an idle-style farming game. Moon Mine and Packet Derby are in development. The open-source repo backs the website content; the game server infrastructure lives separately.",
    ],
    demoUrl: "https://ssharcade.dev/",
    repoUrl: "https://github.com/mynameIs-Nigel/ssharcade-web",
  },
  {
    slug: "full-coverage-technology",
    title: "Full Coverage Technology",
    description: "Full Coverage Technology is a small business that provides technology solutions to small businesses.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://fullcoveragetechnology.com/",
    image: "/projects/fct-1.png",
    preview: { mode: "live", url: "https://fullcoveragetechnology.com/", previewWidth: 1024 },
    screenshots: ["/projects/fct-1.png", "/projects/fct-2.png", "/projects/fct-3.png"],
    content: [
      "Full Coverage Technology is a small business that provides technology solutions to small businesses. I built this website to showcase their services and get them online.",
      "I used Next.js and TypeScript for structure and type safety, deployed on Vercel for previews and production. Content and imagery are easy to swap as the business evolves.",
      "Next steps could include a lightweight CMS or blog if the team wants to publish updates without touching code.",
    ],
    demoUrl: "https://fullcoveragetechnology.com/",
  },
  {
    slug: "walton-tax-professionals",
    title: "Walton Tax Professionals",
    description: "Walton Tax Professionals is a CPA firm offering tax preparation, planning, and IRS representation for individuals and small businesses.",
    tags: ["Next.js", "TypeScript", "Vercel"],
    link: "https://www.waltontaxpro.com/",
    image: "/projects/wtp-1.png",
    preview: { mode: "live", url: "https://www.waltontaxpro.com/", previewWidth: 1024 },
    screenshots: ["/projects/wtp-1.png", "/projects/wtp-2.png", "/projects/wtp-3.png"],
    content: [
      "Walton Tax Professionals is a Monroe, Georgia CPA firm led by Rebecca Smith, CPA, serving clients nationwide. They specialize in complex tax situations—multi-state income, investments, real estate, equity compensation, and entity taxation—rather than simple W-2 returns. I built this website to introduce the firm, lay out their services, and guide visitors toward scheduling a consultation.",
      "I used Next.js and TypeScript for structure and type safety, deployed on Vercel for previews and production. The site leans into the firm's \"no surprises\" approach with clear service descriptions, transparent pricing, and answers to common client questions. Content is easy to update as offerings change.",
      "Next steps could include a client portal or scheduling integration so prospective clients can book consultations directly from the site.",
    ],
    demoUrl: "https://www.waltontaxpro.com/",
  },
  {
    slug: "photography-portfolio",
    title: "Photography Portfolio",
    description: "Side project to showcase my photography skills.",
    tags: ["Next.js", "Typescript", "Vercel"],
    link: "https://ndsironwood.com/",
    image: "/projects/nds-1.png",
    preview: { mode: "live", url: "https://ndsironwood.com/", previewWidth: 1024 },
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
