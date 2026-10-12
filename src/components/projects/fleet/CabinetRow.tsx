import type { FleetCabinet } from "@/types";
import { accentText } from "./accents";

/**
 * The three cabinets, in the order the router's menu lists them.
 *
 * Three cards side by side rather than a list, because they are peers — the menu
 * does not rank them and neither should the page. Each carries its own status,
 * so the row is also the fleet's health at a glance.
 *
 * Status is a dated snapshot in fleet.ts. The connection note labels its date
 * and directs visitors to the lobby for live availability.
 */
export function CabinetRow({ cabinets }: { cabinets: FleetCabinet[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cabinets.map((cabinet) => (
        <li key={cabinet.slug}>
          <Cabinet cabinet={cabinet} />
        </li>
      ))}
    </ul>
  );
}

function Cabinet({ cabinet }: { cabinet: FleetCabinet }) {
  const online = cabinet.status === "online";

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-fg">{cabinet.name}</h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
            online ? accentText[cabinet.accent] : "text-muted"
          }`}
        >
          <span aria-hidden>{online ? "●" : "○"}</span>
          {cabinet.status}
        </span>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{cabinet.tagline}</p>

      <p className="mt-4 font-mono text-[11px] text-fg/45">
        {cabinet.note ?? `select ${cabinet.slug} in the menu`}
      </p>
    </article>
  );
}
