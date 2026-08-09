import type { PersonalityProfileProps } from "@/types";

export const personalitySample: PersonalityProfileProps = {
  type: "ENFP-T",
  title: "The Campaigner",
  traits: [
    {
      label: "Energy",
      value: "Extraverted",
      percentage: 95,
      accent: 1,
      description: "I do my best thinking around other people.",
    },
    {
      label: "Mind",
      value: "Intuitive",
      percentage: 93,
      accent: 2,
      description: "I usually notice the pattern before the details.",
    },
    {
      label: "Nature",
      value: "Feeling",
      percentage: 80,
      accent: 3,
      description: "People matter in how I make a decision.",
    },
    {
      label: "Tactics",
      value: "Prospecting",
      percentage: 64,
      accent: 4,
      description: "I leave room to change the plan.",
    },
  ],
  role: { title: "Role", description: "Diplomat: people first, ideas second." },
  strategy: { title: "Identity", description: "Turbulent (61%): hard on myself, usually in a useful way." },
};
