import type { Experiment, Interest, InterestId } from "@/types";
import { interactiveProjects } from "./interactiveProjects";

/**
 * Side projects for the coding constellation. The interactive ones come from
 * `interactiveProjects.ts`, so shipping one there merges its branch here too.
 */
export const experiments: Experiment[] = [
  {
    branch: "constellations",
    title: "Constellations",
    description: "This sky. The spyglass, the focus ring, and everything behind the four constellations.",
    state: "merged",
  },
  {
    branch: "ssh-arcade",
    title: "SSH Arcade",
    description: "Terminal games you play over SSH: four Go services on one EC2 instance, deployed from GitHub Releases.",
    state: "merged",
    href: "/projects/ssh-arcade-fleet",
  },
  {
    branch: "portfolio-shell",
    title: "Portfolio shell",
    description: "A browser-only Unix-ish shell on the Projects page. Your files survive a reload; nothing leaves the browser.",
    state: "merged",
    href: "/projects#shell",
  },
  {
    branch: "ambient-skies",
    title: "Ambient skies",
    description: "Storm, night, and fireflies in the side gutters. The fireflies fall into sync using the Kuramoto model.",
    state: "merged",
    href: "/?ambient=fireflies",
  },
  ...interactiveProjects.map(
    (p): Experiment => ({
      branch: p.slug,
      title: p.title,
      description: p.description,
      state: p.status === "live" ? "merged" : "open",
      href: p.status === "live" ? `/projects/interactive/${p.slug}` : undefined,
    }),
  ),
];

const openExperiments = experiments.filter((e) => e.state === "open").length;

/** The four constellations on /about, in the order they appear on the way down the sky. */
export const interests: Interest[] = [
  {
    id: "photography",
    numeral: "I",
    constellation: "Camera Obscura",
    gloss: "the dark room",
    title: "Photography",
    tagline: "Collecting little moments.",
    description: "I carry a Sony a6700 most often, but I still shoot film when I can.",
    teaser: "6 frames · one contact sheet",
    tags: ["Film", "Digital"],
    accent: 2,
  },
  {
    id: "music",
    numeral: "II",
    constellation: "Lyra Nova",
    gloss: "the new lyre",
    title: "Music",
    tagline: "Good music. Questionable volume.",
    description: "My rotation moves between metal, electronic, rock, and pop.",
    teaser: "6 records · one turntable",
    tags: ["Metal", "Electronic", "Rock", "Pop"],
    accent: 3,
  },
  {
    id: "coding",
    numeral: "III",
    constellation: "Machina",
    gloss: "the machine",
    title: "Coding",
    tagline: "One unfamiliar thing at a time.",
    description: "Most of my side projects start as an excuse to learn one unfamiliar thing.",
    teaser: `${experiments.length} branches · ${openExperiments} still open`,
    tags: ["Python", "C#", "TypeScript"],
    accent: 1,
  },
  {
    id: "cars",
    numeral: "IV",
    constellation: "Currus",
    gloss: "the chariot",
    title: "Cars",
    tagline: "A different kind of debugging.",
    description: "I like working on, modifying, and driving cars. My wallet likes this less.",
    teaser: "1 tachometer · 1 nervous wallet",
    tags: ["BMW"],
    accent: 4,
  },
];

export function getInterestById(id: InterestId): Interest | undefined {
  return interests.find((i) => i.id === id);
}
