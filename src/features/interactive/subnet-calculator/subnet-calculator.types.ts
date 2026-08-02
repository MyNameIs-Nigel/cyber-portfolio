export interface ParsedAddress {
  /** Unsigned 32-bit value of the dotted-quad address. */
  addressInt: number;
  /** Prefix length parsed from the input (`/24` or `/255.255.255.0`), or null when absent. */
  prefix: number | null;
}

export type ParseResult = { ok: true; value: ParsedAddress } | { ok: false; error: string };

/** A well-known IPv4 block (RFC 1918, loopback, multicast, …). */
export interface SpecialRange {
  cidr: string;
  label: string;
  detail: string;
}

export interface SubnetSummary {
  /** The address exactly as it was resolved, without a prefix. */
  address: string;
  prefix: number;
  cidr: string;
  netmask: string;
  wildcard: string;
  network: string;
  /** Null for /31 and /32, which have no broadcast address. */
  broadcast: string | null;
  firstHost: string | null;
  lastHost: string | null;
  totalAddresses: number;
  usableHosts: number;
  hostBits: number;
  addressClass: string;
  scopeLabel: string;
  scopeDetail: string;
  addressInt: number;
  networkInt: number;
  maskInt: number;
  /** /32 — a single host route. */
  isHostRoute: boolean;
  /** /31 — an RFC 3021 point-to-point link. */
  isPointToPoint: boolean;
}

export interface SubnetSplitRow {
  index: number;
  cidr: string;
  network: string;
  firstHost: string | null;
  lastHost: string | null;
  broadcast: string | null;
}

export interface SubnetSplit {
  prefix: number;
  /** Total subnets produced by the split, even when `rows` is truncated. */
  count: number;
  hostsPerSubnet: number;
  rows: SubnetSplitRow[];
  truncated: boolean;
}
