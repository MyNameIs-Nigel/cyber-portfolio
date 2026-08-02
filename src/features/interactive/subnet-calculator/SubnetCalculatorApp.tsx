"use client";

import {
  MAX_PREFIX,
  MIN_PREFIX,
  PRESETS,
  SHELL_MIN_HEIGHT_PX,
  SPLIT_ROW_LIMIT,
} from "@/features/interactive/subnet-calculator/subnet-calculator.constants";
import { toBits } from "@/features/interactive/subnet-calculator/subnet-calculator.math";
import { useSubnetCalculator } from "@/features/interactive/subnet-calculator/useSubnetCalculator";

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

/** 32 bits grouped into octets, network portion highlighted against the host portion. */
function BinaryLine({ label, value, prefix }: { label: string; value: number; prefix: number }) {
  const bits = toBits(value);
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="w-20 shrink-0 font-mono text-xs text-muted">{label}</span>
      <span className="font-mono text-xs tracking-tight sm:text-sm">
        {[0, 1, 2, 3].map((octet) => (
          <span key={octet}>
            {octet > 0 ? <span className="text-border">.</span> : null}
            {bits
              .slice(octet * 8, octet * 8 + 8)
              .split("")
              .map((bit, i) => {
                const index = octet * 8 + i;
                return (
                  <span key={index} className={index < prefix ? "text-accent-1" : "text-accent-4"}>
                    {bit}
                  </span>
                );
              })}
          </span>
        ))}
      </span>
    </div>
  );
}

function StatField({
  label,
  value,
  hint,
  copyKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  value: string;
  hint?: string;
  copyKey?: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  const copied = copyKey !== undefined && copiedKey === copyKey;

  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
        {copied ? <span className="text-[11px] text-accent-1">copied</span> : null}
      </div>
      {copyKey ? (
        <button
          type="button"
          onClick={() => onCopy(copyKey, value)}
          title="Copy to clipboard"
          className="mt-1 block w-full break-all text-left font-mono text-sm text-fg transition-colors duration-200 hover:text-accent-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {value}
        </button>
      ) : (
        <p className="mt-1 break-all font-mono text-sm text-fg">{value}</p>
      )}
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

export function SubnetCalculatorApp() {
  const {
    addressText,
    setAddressText,
    prefix,
    changePrefix,
    error,
    summary,
    split,
    splitPrefix,
    setSplitPrefix,
    splitOptions,
    applyPreset,
    copy,
    copiedKey,
  } = useSubnetCalculator();

  const hostRange =
    summary === null
      ? "—"
      : summary.firstHost === summary.lastHost
        ? (summary.firstHost ?? "—")
        : `${summary.firstHost} – ${summary.lastHost}`;

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border py-3 text-center font-mono text-sm text-muted">
        <span className="text-accent-1">&gt;</span> subnet-calculator
      </div>

      <div className="flex flex-col gap-6 p-5" style={{ minHeight: SHELL_MIN_HEIGHT_PX }}>
        <div className="space-y-4">
          <div>
            <label htmlFor="subnet-address" className="block font-mono text-xs uppercase tracking-wider text-muted">
              IPv4 address or CIDR
            </label>
            <input
              id="subnet-address"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="text"
              placeholder="192.168.1.10/24"
              aria-invalid={error !== null}
              aria-describedby={error ? "subnet-address-error" : undefined}
              className={`mt-2 w-full rounded-lg border bg-bg px-3 py-2.5 font-mono text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                error ? "border-red-500/60 focus-visible:ring-red-500" : "border-border focus-visible:ring-accent-1"
              }`}
            />
            <p className="mt-2 text-xs text-muted">
              Accepts <span className="font-mono text-fg">10.0.0.1</span>,{" "}
              <span className="font-mono text-fg">10.0.0.1/8</span>, or{" "}
              <span className="font-mono text-fg">10.0.0.1/255.0.0.0</span>.
            </p>
            {error ? (
              <p id="subnet-address-error" role="alert" className="mt-2 font-mono text-xs text-red-500">
                [ ERR ] {error}
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="subnet-prefix" className="font-mono text-xs uppercase tracking-wider text-muted">
                Prefix length
              </label>
              <span className="font-mono text-sm text-fg">
                <span className="text-accent-1">/{prefix}</span>
                {summary ? <span className="ml-2 text-muted">{summary.netmask}</span> : null}
              </span>
            </div>
            <input
              id="subnet-prefix"
              type="range"
              min={MIN_PREFIX}
              max={MAX_PREFIX}
              step={1}
              value={prefix}
              onChange={(e) => changePrefix(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-accent-1)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => applyPreset(preset.value)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors duration-200 hover:border-accent-1/50 hover:text-accent-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {summary ? (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-sm text-accent-1" role="status" aria-live="polite">
                [ OK ] {summary.cidr}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatField
                  label="Network address"
                  value={summary.network}
                  copyKey="network"
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Broadcast address"
                  value={summary.broadcast ?? "—"}
                  hint={
                    summary.isHostRoute
                      ? "A /32 is a single host route."
                      : summary.isPointToPoint
                        ? "A /31 has no broadcast address (RFC 3021)."
                        : undefined
                  }
                  copyKey={summary.broadcast ? "broadcast" : undefined}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Usable host range"
                  value={hostRange}
                  copyKey={summary.firstHost ? "range" : undefined}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Usable hosts"
                  value={formatCount(summary.usableHosts)}
                  hint={`${formatCount(summary.totalAddresses)} total addresses · ${summary.hostBits} host bits`}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Subnet mask"
                  value={summary.netmask}
                  copyKey="netmask"
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Wildcard mask"
                  value={summary.wildcard}
                  hint="ACL / OSPF inverse mask"
                  copyKey="wildcard"
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="CIDR notation"
                  value={summary.cidr}
                  copyKey="cidr"
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Scope"
                  value={summary.scopeLabel}
                  hint={summary.scopeDetail}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
                <StatField
                  label="Legacy class"
                  value={summary.addressClass}
                  hint="Classful ranges are historical — CIDR supersedes them."
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted">Binary breakdown</h3>
                <p className="font-mono text-[11px] text-muted">
                  <span className="text-accent-1">network</span> · <span className="text-accent-4">host</span>
                </p>
              </div>
              <div className="mt-3 space-y-2 overflow-x-auto">
                <BinaryLine label="address" value={summary.addressInt} prefix={prefix} />
                <BinaryLine label="mask" value={summary.maskInt} prefix={prefix} />
                <BinaryLine label="network" value={summary.networkInt} prefix={prefix} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                The first {prefix} bit{prefix === 1 ? "" : "s"} identify the network; the remaining {summary.hostBits}{" "}
                address {summary.hostBits === 1 ? "host" : "hosts"} inside it.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted">Split this network</h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="subnet-split" className="font-mono text-xs text-muted">
                    into
                  </label>
                  <select
                    id="subnet-split"
                    value={splitPrefix ?? ""}
                    onChange={(e) => setSplitPrefix(e.target.value === "" ? null : Number(e.target.value))}
                    disabled={splitOptions.length === 0}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-fg transition-colors duration-200 hover:border-accent-1/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50"
                  >
                    <option value="">select prefix…</option>
                    {splitOptions.map((option) => (
                      <option key={option} value={option}>
                        /{option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {split ? (
                <>
                  <p className="mt-3 font-mono text-xs text-muted">
                    <span className="text-fg">{formatCount(split.count)}</span> subnet{split.count === 1 ? "" : "s"} ·{" "}
                    <span className="text-fg">{formatCount(split.hostsPerSubnet)}</span> usable host
                    {split.hostsPerSubnet === 1 ? "" : "s"} each
                    {split.truncated ? ` · showing the first ${SPLIT_ROW_LIMIT}` : ""}
                  </p>
                  <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-border">
                    <table className="w-full min-w-[34rem] border-collapse font-mono text-xs">
                      <thead className="sticky top-0 bg-surface text-left text-muted">
                        <tr>
                          <th scope="col" className="border-b border-border px-3 py-2 font-normal">
                            #
                          </th>
                          <th scope="col" className="border-b border-border px-3 py-2 font-normal">
                            Subnet
                          </th>
                          <th scope="col" className="border-b border-border px-3 py-2 font-normal">
                            Host range
                          </th>
                          <th scope="col" className="border-b border-border px-3 py-2 font-normal">
                            Broadcast
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {split.rows.map((row) => (
                          <tr key={row.cidr} className="transition-colors duration-150 hover:bg-surface">
                            <td className="border-b border-border/60 px-3 py-1.5 text-muted">{row.index}</td>
                            <td className="border-b border-border/60 px-3 py-1.5 text-accent-1">{row.cidr}</td>
                            <td className="whitespace-nowrap border-b border-border/60 px-3 py-1.5 text-fg">
                              {row.firstHost === row.lastHost ? row.firstHost : `${row.firstHost} – ${row.lastHost}`}
                            </td>
                            <td className="border-b border-border/60 px-3 py-1.5 text-muted">{row.broadcast ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {splitOptions.length === 0
                    ? "A /32 is a single address — there is nothing left to divide."
                    : "Pick a longer prefix to divide this network into equal-size subnets."}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
