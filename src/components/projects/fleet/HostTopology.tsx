import type { TopologyNode } from "@/types";
import { accentChip, accentText } from "./accents";

/**
 * The nest: containment. One public listener wrapping private ones, drawn with
 * real nesting rather than arrows — the point is what is inside what, not what
 * happens first. Unnumbered, for the same reason.
 *
 * `chess` renders OFFLINE because that is its true state today: it is listed in
 * the registry ahead of its first deploy, and the health prober degrades it in
 * the menu rather than breaking the arcade. Showing that is better evidence
 * than hiding it.
 */
export function HostTopology({
  nodes,
  chain,
  caption,
}: {
  nodes: TopologyNode[];
  chain: string[];
  caption: string;
}) {
  const router = nodes[0];
  const games = nodes.slice(1);

  return (
    <figure className="m-0 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-2">
        Topology
      </p>
      <h3 className="mt-2 text-lg font-semibold text-fg">One public port, everything else private</h3>

      <div aria-hidden className="mt-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-fg/55">
          {chain.map((hop, i) => (
            <li key={hop} className="inline-flex items-center gap-2">
              {i > 0 ? <span className="text-fg/35">→</span> : null}
              {hop}
            </li>
          ))}
        </ol>

        <div className="mt-3 rounded-xl border border-accent-2/30 p-3">
          <ServiceRow node={router} />

          <div className="mt-3 rounded-lg border border-rail p-3">
            <p className="mb-3 font-mono text-[11px] text-fg/45">private bridge · ssharcade</p>
            <ul className="space-y-3">
              {games.map((node) => (
                <li key={node.name}>
                  <ServiceRow node={node} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <figcaption className="mt-6 text-sm leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

function ServiceRow({ node }: { node: TopologyNode }) {
  const online = node.status === "online";
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={`font-mono text-xs font-semibold ${online ? accentText[node.accent] : "text-muted"}`}>
          {online ? "●" : "○"} {node.name}
        </span>
        <span className="font-mono text-[11px] text-fg/45">{node.ports}</span>
        <span className={`ml-auto font-mono text-[10px] uppercase tracking-[0.18em] ${online ? "text-fg/45" : "text-muted"}`}>
          {online ? "online" : "offline"}
        </span>
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1">
        {node.posture.map((flag) => (
          <li
            key={flag}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
              online ? accentChip[node.accent] : "border-border bg-band text-muted"
            }`}
          >
            {flag}
          </li>
        ))}
      </ul>
    </div>
  );
}
