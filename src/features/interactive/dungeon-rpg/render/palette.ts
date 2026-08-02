/**
 * Colours come from the site theme, never from hardcoded hex in the game.
 *
 * `globals.css` owns `--color-bg`, `--color-accent-1..4` and friends; reading them at mount
 * means the canvas can't drift from the rest of the portfolio when the palette is revised.
 * The fallbacks exist so a renamed variable produces a slightly-off canvas rather than a
 * blank one.
 */

export type Palette = {
  bg: string;
  surface: string;
  border: string;
  fg: string;
  muted: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
};

/** Mirrors the `:root` block in `src/app/globals.css`. */
export const FALLBACK_PALETTE: Palette = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  fg: "#e5e5e5",
  muted: "#737373",
  accent1: "#22c55e",
  accent2: "#f97316",
  accent3: "#8b5cf6",
  accent4: "#38bdf8",
};

const VARIABLE_NAMES: Record<keyof Palette, string> = {
  bg: "--color-bg",
  surface: "--color-surface",
  border: "--color-border",
  fg: "--color-fg",
  muted: "--color-muted",
  accent1: "--color-accent-1",
  accent2: "--color-accent-2",
  accent3: "--color-accent-3",
  accent4: "--color-accent-4",
};

export function readPalette(): Palette {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") {
    return FALLBACK_PALETTE;
  }
  try {
    const computed = getComputedStyle(document.documentElement);
    const entries = Object.entries(VARIABLE_NAMES) as [keyof Palette, string][];
    const palette = { ...FALLBACK_PALETTE };
    for (const [key, variable] of entries) {
      const value = computed.getPropertyValue(variable).trim();
      if (value) palette[key] = value;
    }
    return palette;
  } catch {
    return FALLBACK_PALETTE;
  }
}

/** `#rrggbb` plus an alpha, as `rgba(...)`. Falls through unchanged for anything else. */
export function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return color;
  const hex = Number.parseInt(match[1]!, 16);
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function accentColor(palette: Palette, accent: 1 | 2 | 3 | 4): string {
  switch (accent) {
    case 1:
      return palette.accent1;
    case 2:
      return palette.accent2;
    case 3:
      return palette.accent3;
    case 4:
      return palette.accent4;
  }
}
