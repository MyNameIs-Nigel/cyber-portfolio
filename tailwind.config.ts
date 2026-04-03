import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        "accent-1": "var(--color-accent-1)",
        "accent-2": "var(--color-accent-2)",
        "accent-3": "var(--color-accent-3)",
        "accent-4": "var(--color-accent-4)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Config;

export default config;
