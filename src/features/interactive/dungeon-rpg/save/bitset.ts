/**
 * The explored map as a bitset, encoded base64 for storage.
 *
 * `MAP_W * MAP_H` is 1536 bits ≈ 192 bytes ≈ 256 base64 characters, versus several KB
 * for the same information as an array of coordinates.
 *
 * base64 is hand-rolled rather than delegated to `btoa`/`Buffer` so the same code runs
 * unchanged in the browser, in a `node` test environment, and during a static build.
 */

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const B64_LOOKUP: Record<string, number> = {};
for (let i = 0; i < B64_ALPHABET.length; i++) {
  B64_LOOKUP[B64_ALPHABET[i]!] = i;
}

export function byteLengthForBits(bits: number): number {
  return Math.ceil(Math.max(0, bits) / 8);
}

export function createBitset(bits: number): Uint8Array {
  return new Uint8Array(byteLengthForBits(bits));
}

export function getBit(set: Uint8Array, index: number): boolean {
  if (index < 0) return false;
  const byte = index >> 3;
  if (byte >= set.length) return false;
  return (set[byte]! & (1 << (index & 7))) !== 0;
}

export function setBit(set: Uint8Array, index: number): void {
  if (index < 0) return;
  const byte = index >> 3;
  if (byte >= set.length) return;
  set[byte] = set[byte]! | (1 << (index & 7));
}

export function encodeBitset(set: Uint8Array): string {
  let out = "";
  for (let i = 0; i < set.length; i += 3) {
    const b0 = set[i]!;
    const b1 = i + 1 < set.length ? set[i + 1]! : 0;
    const b2 = i + 2 < set.length ? set[i + 2]! : 0;
    out += B64_ALPHABET[b0 >> 2];
    out += B64_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < set.length ? B64_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < set.length ? B64_ALPHABET[b2 & 0x3f] : "=";
  }
  return out;
}

/**
 * Decodes to exactly `bits` worth of bytes. Returns `null` for anything malformed —
 * a save is untrusted input, and the caller starts a fresh run rather than guessing.
 */
export function decodeBitset(encoded: string, bits: number): Uint8Array | null {
  if (typeof encoded !== "string") return null;
  const clean = encoded.replace(/=+$/, "");
  if (clean.length % 4 === 1) return null;

  const expected = byteLengthForBits(bits);
  const out = new Uint8Array(expected);
  let outIndex = 0;
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const ch of clean) {
    const value = B64_LOOKUP[ch];
    if (value === undefined) return null;
    buffer = (buffer << 6) | value;
    bitsInBuffer += 6;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      const byte = (buffer >> bitsInBuffer) & 0xff;
      if (outIndex < expected) out[outIndex] = byte;
      outIndex += 1;
    }
  }

  // A bitset that decodes to the wrong size is a schema mismatch, not a recoverable save.
  return outIndex === expected ? out : null;
}
