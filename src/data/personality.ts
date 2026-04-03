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
      description: "Energised by social interaction and external stimulation.",
    },
    {
      label: "Mind",
      value: "Intuitive",
      percentage: 93,
      accent: 2,
      description: "Drawn to patterns, possibilities, and the big picture.",
    },
    {
      label: "Nature",
      value: "Feeling",
      percentage: 80,
      accent: 3,
      description: "Decisions guided by empathy and personal values.",
    },
    {
      label: "Tactics",
      value: "Prospecting",
      percentage: 64,
      accent: 4,
      description: "Flexible, spontaneous, and open to new options.",
    },
  ],
  role: { title: "Role", description: "Diplomat — connects ideas with people." },
  strategy: { title: "Identity", description: "Turbulent (61%) — self-improving, emotionally aware, and driven by high standards." },
};
