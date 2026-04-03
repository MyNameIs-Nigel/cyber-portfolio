import type { PlusMinusProps } from "@/types";

export function PlusMinus({ plusTitle, minusTitle, plusItems, minusItems }: PlusMinusProps) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <h3 className="font-mono text-sm font-semibold text-fg">{plusTitle}</h3>
        <ul className="mt-3 space-y-2">
          {plusItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-fg">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-1" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-mono text-sm font-semibold text-fg">{minusTitle}</h3>
        <ul className="mt-3 space-y-2">
          {minusItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-fg">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
