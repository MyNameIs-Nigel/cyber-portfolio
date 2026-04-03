import type { MediaItem } from "@/types";

const sq = "https://placehold.co/400x400/141414/737373?text=IMG";

export const musicRotation: MediaItem[] = [
  { image: "/albums/loathe.jpg", title: "I Let It In And It Took Everything", subtitle: "Loathe", accent: 1 },
  { image: "/albums/nin.png", title: "The Downward Spiral", subtitle: "Nine Inch Nails", accent: 2 },
  { image: "/albums/yoyo.jpg", title: "yoyo", subtitle: "A Beacon School", accent: 3 },
  { image: "/albums/mezzanine.png", title: "Mezzanine", subtitle: "Massive Attack", accent: 4 },
  { image: "/albums/spiritbox.jpg", title: "Eternal Blue", subtitle: "Spiritbox", accent: 1 },
  { image: "/albums/magdalenabay.png", title: "Imaginal Disk", subtitle: "Magdalena Bay", accent: 2 },
];

export const mediaShowcase: MediaItem[] = [
  { image: sq, title: "Lorem Movie", subtitle: "Studio Lorem", accent: 1 },
  { image: sq, title: "Lorem Game", subtitle: "PC / Console", accent: 2 },
  { image: sq, title: "Lorem Album", subtitle: "Artist Ipsum", accent: 3 },
  { image: sq, title: "Lorem Series", subtitle: "Streaming", accent: 4 },
];

export const photoShowcase = [
  { image: sq, caption: "2024" },
  { image: sq, caption: "2023" },
  { image: sq, caption: "2022" },
  { image: sq, caption: "2021" },
  { image: sq, caption: "2020" },
  { image: sq, caption: "2019" },
];
