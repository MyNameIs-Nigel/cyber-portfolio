import type { SpecialRange } from "@/features/interactive/subnet-calculator/subnet-calculator.types";

export const DEFAULT_ADDRESS = "192.168.1.10";
export const DEFAULT_PREFIX = 24;

export const MIN_PREFIX = 0;
export const MAX_PREFIX = 32;

/** Keeps the split table from rendering millions of rows for a wide network. */
export const SPLIT_ROW_LIMIT = 64;

/** Matches the tallest result layout so the shell doesn't jump while typing. */
export const SHELL_MIN_HEIGHT_PX = 600;

export const PRESETS: { label: string; value: string }[] = [
  { label: "Home LAN", value: "192.168.1.10/24" },
  { label: "Class A private", value: "10.20.30.40/8" },
  { label: "Class B private", value: "172.16.5.20/20" },
  { label: "Point-to-point", value: "203.0.113.6/31" },
  { label: "CGNAT", value: "100.64.0.1/10" },
];

/**
 * Well-known IPv4 blocks, most specific first — the first match wins.
 * Sourced from the IANA IPv4 Special-Purpose Address Registry.
 */
export const SPECIAL_RANGES: SpecialRange[] = [
  { cidr: "255.255.255.255/32", label: "Limited broadcast", detail: "RFC 919 — local broadcast, never routed" },
  { cidr: "0.0.0.0/8", label: "This network", detail: "RFC 1122 — source-only, not a valid destination" },
  { cidr: "127.0.0.0/8", label: "Loopback", detail: "RFC 1122 — never leaves the host" },
  { cidr: "169.254.0.0/16", label: "Link-local", detail: "RFC 3927 — APIPA, self-assigned when DHCP fails" },
  { cidr: "10.0.0.0/8", label: "Private", detail: "RFC 1918 — not routable on the public internet" },
  { cidr: "172.16.0.0/12", label: "Private", detail: "RFC 1918 — not routable on the public internet" },
  { cidr: "192.168.0.0/16", label: "Private", detail: "RFC 1918 — not routable on the public internet" },
  { cidr: "100.64.0.0/10", label: "Carrier-grade NAT", detail: "RFC 6598 — shared ISP address space" },
  { cidr: "192.0.2.0/24", label: "Documentation", detail: "RFC 5737 — TEST-NET-1, examples only" },
  { cidr: "198.51.100.0/24", label: "Documentation", detail: "RFC 5737 — TEST-NET-2, examples only" },
  { cidr: "203.0.113.0/24", label: "Documentation", detail: "RFC 5737 — TEST-NET-3, examples only" },
  { cidr: "198.18.0.0/15", label: "Benchmarking", detail: "RFC 2544 — network device testing" },
  { cidr: "192.88.99.0/24", label: "6to4 relay anycast", detail: "RFC 7526 — deprecated" },
  { cidr: "224.0.0.0/4", label: "Multicast", detail: "RFC 5771 — class D, one-to-many delivery" },
  { cidr: "240.0.0.0/4", label: "Reserved", detail: "RFC 1112 — class E, reserved for future use" },
];
