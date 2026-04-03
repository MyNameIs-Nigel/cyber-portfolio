import type { Accent, ValueCardProps } from "@/types";

const borderAccent: Record<Accent, string> = {
  1: "border-accent-1",
  2: "border-accent-2",
  3: "border-accent-3",
  4: "border-accent-4",
};

export function ValueCard({ title, description, accent = 1 }: ValueCardProps) {
  return (
    <section>
      <h3 className={`border-l-2 ${borderAccent[accent]} pl-4 text-lg font-semibold text-fg`}>{title}</h3>
      <p className="mt-1 pl-4 text-sm text-muted">{description}</p>
    </section>
  );
}
