import type { Accent } from "@/types";

const accentBullet: Record<Accent, string> = {
  1: "bg-accent-1",
  2: "bg-accent-2",
  3: "bg-accent-3",
  4: "bg-accent-4",
};

export function AccentList({ accent, items }: { accent: Accent; items: string[] }) {
  const bullet = accentBullet[accent];
  return (
    <ul className="ml-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${bullet}`} aria-hidden />
          <span className="leading-relaxed text-fg">{item}</span>
        </li>
      ))}
    </ul>
  );
}
