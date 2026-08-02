"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ADDRESS,
  DEFAULT_PREFIX,
  MAX_PREFIX,
} from "@/features/interactive/subnet-calculator/subnet-calculator.constants";
import { parseAddressInput, splitNetwork, summarize } from "@/features/interactive/subnet-calculator/subnet-calculator.math";

const COPIED_RESET_MS = 1200;

/** Replaces (or appends) the `/prefix` suffix so the text field and the slider never disagree. */
function withPrefix(addressText: string, prefix: number): string {
  const [addressPart] = addressText.trim().split("/");
  return `${addressPart}/${prefix}`;
}

export function useSubnetCalculator() {
  const [addressText, setAddressText] = useState(`${DEFAULT_ADDRESS}/${DEFAULT_PREFIX}`);
  const [fallbackPrefix, setFallbackPrefix] = useState(DEFAULT_PREFIX);
  const [splitPrefix, setSplitPrefix] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const parsed = useMemo(() => parseAddressInput(addressText), [addressText]);

  // A prefix typed into the field wins; the slider supplies one when the text omits it.
  const prefix = parsed.ok ? (parsed.value.prefix ?? fallbackPrefix) : fallbackPrefix;

  const summary = useMemo(
    () => (parsed.ok ? summarize(parsed.value.addressInt, prefix) : null),
    [parsed, prefix],
  );

  // Splitting into a prefix the network no longer contains is meaningless, so drop it.
  const activeSplitPrefix = splitPrefix !== null && splitPrefix > prefix ? splitPrefix : null;

  const split = useMemo(
    () => (summary && activeSplitPrefix !== null ? splitNetwork(summary.networkInt, prefix, activeSplitPrefix) : null),
    [summary, prefix, activeSplitPrefix],
  );

  const splitOptions = useMemo(() => {
    const options: number[] = [];
    for (let p = prefix + 1; p <= MAX_PREFIX; p++) options.push(p);
    return options;
  }, [prefix]);

  const changePrefix = useCallback(
    (next: number) => {
      setFallbackPrefix(next);
      setAddressText((current) => (current.includes("/") ? withPrefix(current, next) : current));
    },
    [],
  );

  const applyPreset = useCallback((value: string) => {
    setAddressText(value);
    const result = parseAddressInput(value);
    if (result.ok && result.value.prefix !== null) setFallbackPrefix(result.value.prefix);
    setSplitPrefix(null);
  }, []);

  const copy = useCallback((key: string, value: string) => {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopiedKey(key);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopiedKey(null), COPIED_RESET_MS);
      })
      .catch(() => {
        /* clipboard blocked — the value is still on screen */
      });
  }, []);

  return {
    addressText,
    setAddressText,
    prefix,
    changePrefix,
    error: parsed.ok ? null : parsed.error,
    summary,
    split,
    splitPrefix: activeSplitPrefix,
    setSplitPrefix,
    splitOptions,
    applyPreset,
    copy,
    copiedKey,
  };
}
