import { MAX_PREFIX, MIN_PREFIX, SPECIAL_RANGES, SPLIT_ROW_LIMIT } from "@/features/interactive/subnet-calculator/subnet-calculator.constants";
import type {
  ParseResult,
  SubnetSplit,
  SubnetSplitRow,
  SubnetSummary,
} from "@/features/interactive/subnet-calculator/subnet-calculator.types";

const DOTTED_QUAD = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Bitwise ops in JS are signed; `>>> 0` keeps every address in unsigned 32-bit space. */
function toUint32(n: number): number {
  return n >>> 0;
}

export function intToIp(value: number): string {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}

export function ipToInt(dotted: string): number | null {
  const match = DOTTED_QUAD.exec(dotted.trim());
  if (!match) return null;

  let value = 0;
  for (let i = 1; i <= 4; i++) {
    const octet = Number(match[i]);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    value = value * 256 + octet;
  }
  return toUint32(value);
}

export function maskFromPrefix(prefix: number): number {
  // `0xFFFFFFFF << 32` wraps to a no-op shift in JS, so /0 needs its own branch.
  return prefix === 0 ? 0 : toUint32(0xffffffff << (32 - prefix));
}

/** Returns the prefix length of a contiguous dotted mask, or null if the mask has gaps. */
export function prefixFromMask(maskInt: number): number | null {
  for (let prefix = MIN_PREFIX; prefix <= MAX_PREFIX; prefix++) {
    if (maskFromPrefix(prefix) === maskInt) return prefix;
  }
  return null;
}

/** Accepts `a.b.c.d`, `a.b.c.d/24`, and `a.b.c.d/255.255.255.0`. */
export function parseAddressInput(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter an IPv4 address." };

  const slashCount = (trimmed.match(/\//g) ?? []).length;
  if (slashCount > 1) return { ok: false, error: "Only one “/” is allowed." };

  const [addressPart, prefixPart] = trimmed.split("/");
  const addressInt = ipToInt(addressPart);
  if (addressInt === null) {
    return { ok: false, error: "Not a valid IPv4 address — expected four octets of 0–255." };
  }

  if (prefixPart === undefined) {
    return { ok: true, value: { addressInt, prefix: null } };
  }

  const rawPrefix = prefixPart.trim();
  if (!rawPrefix) return { ok: false, error: "Add a prefix length after the “/”, e.g. /24." };

  if (rawPrefix.includes(".")) {
    const maskInt = ipToInt(rawPrefix);
    if (maskInt === null) return { ok: false, error: "Not a valid subnet mask." };
    const prefix = prefixFromMask(maskInt);
    if (prefix === null) return { ok: false, error: "Subnet mask bits must be contiguous, e.g. 255.255.255.0." };
    return { ok: true, value: { addressInt, prefix } };
  }

  if (!/^\d{1,2}$/.test(rawPrefix)) return { ok: false, error: "Prefix length must be a number from 0 to 32." };
  const prefix = Number(rawPrefix);
  if (prefix < MIN_PREFIX || prefix > MAX_PREFIX) {
    return { ok: false, error: "Prefix length must be a number from 0 to 32." };
  }
  return { ok: true, value: { addressInt, prefix } };
}

function addressClassOf(addressInt: number): string {
  const firstOctet = (addressInt >>> 24) & 255;
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D — multicast";
  return "E — reserved";
}

function scopeOf(addressInt: number): { label: string; detail: string } {
  for (const range of SPECIAL_RANGES) {
    const [rangeAddress, rangePrefix] = range.cidr.split("/");
    const rangeInt = ipToInt(rangeAddress);
    if (rangeInt === null) continue;
    const mask = maskFromPrefix(Number(rangePrefix));
    if (toUint32(addressInt & mask) === toUint32(rangeInt & mask)) {
      return { label: range.label, detail: range.detail };
    }
  }
  return { label: "Public", detail: "Globally routable address space" };
}

export function summarize(addressInt: number, prefix: number): SubnetSummary {
  const maskInt = maskFromPrefix(prefix);
  const networkInt = toUint32(addressInt & maskInt);
  const broadcastInt = toUint32(networkInt | toUint32(~maskInt));
  const hostBits = 32 - prefix;
  const totalAddresses = 2 ** hostBits;

  const isHostRoute = prefix === 32;
  const isPointToPoint = prefix === 31;

  let firstHost: string | null;
  let lastHost: string | null;
  let usableHosts: number;

  if (isHostRoute) {
    // A /32 is a single address: it is its own "range".
    firstHost = intToIp(networkInt);
    lastHost = intToIp(networkInt);
    usableHosts = 1;
  } else if (isPointToPoint) {
    // RFC 3021: on a /31 both addresses are usable — there is no network/broadcast pair.
    firstHost = intToIp(networkInt);
    lastHost = intToIp(broadcastInt);
    usableHosts = 2;
  } else {
    firstHost = intToIp(networkInt + 1);
    lastHost = intToIp(broadcastInt - 1);
    usableHosts = totalAddresses - 2;
  }

  const scope = scopeOf(addressInt);

  return {
    address: intToIp(addressInt),
    prefix,
    cidr: `${intToIp(networkInt)}/${prefix}`,
    netmask: intToIp(maskInt),
    wildcard: intToIp(toUint32(~maskInt)),
    network: intToIp(networkInt),
    broadcast: isHostRoute || isPointToPoint ? null : intToIp(broadcastInt),
    firstHost,
    lastHost,
    totalAddresses,
    usableHosts,
    hostBits,
    addressClass: addressClassOf(addressInt),
    scopeLabel: scope.label,
    scopeDetail: scope.detail,
    addressInt,
    networkInt,
    maskInt,
    isHostRoute,
    isPointToPoint,
  };
}

/** Divides a network into equal-size blocks of `newPrefix`, capped at `SPLIT_ROW_LIMIT` rows. */
export function splitNetwork(networkInt: number, prefix: number, newPrefix: number): SubnetSplit | null {
  if (newPrefix <= prefix || newPrefix > MAX_PREFIX) return null;

  const count = 2 ** (newPrefix - prefix);
  const blockSize = 2 ** (32 - newPrefix);
  const shown = Math.min(count, SPLIT_ROW_LIMIT);

  const rows: SubnetSplitRow[] = [];
  for (let i = 0; i < shown; i++) {
    const subnetInt = toUint32(networkInt + i * blockSize);
    const summary = summarize(subnetInt, newPrefix);
    rows.push({
      index: i + 1,
      cidr: summary.cidr,
      network: summary.network,
      firstHost: summary.firstHost,
      lastHost: summary.lastHost,
      broadcast: summary.broadcast,
    });
  }

  return {
    prefix: newPrefix,
    count,
    hostsPerSubnet: summarize(networkInt, newPrefix).usableHosts,
    rows,
    truncated: count > shown,
  };
}

/** 32-character big-endian bit string, used for the binary breakdown. */
export function toBits(value: number): string {
  return (value >>> 0).toString(2).padStart(32, "0");
}
