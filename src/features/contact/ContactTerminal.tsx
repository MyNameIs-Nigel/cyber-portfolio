"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type KeyboardEvent,
  type Ref,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  MAX_LENGTHS,
  METHOD_META,
  SEND_HINT,
  SEND_HINT_MAC,
  STEP_ORDER,
  isSendShortcut,
  type ContactStep,
} from "./contact.constants";
import { isValidContactValue } from "./contact.validation";
import { useContactForm, type ContactFormApi } from "./useContactForm";
import type { ContactMethod } from "./contact.types";

const block: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const fieldGroup: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.45, staggerChildren: 0.16 } },
};

function reached(step: ContactStep, target: ContactStep): boolean {
  return STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(target);
}

function done(step: ContactStep, target: ContactStep): boolean {
  return STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(target);
}

const subscribeNoop = () => () => {};
const getIsMacSnapshot = () =>
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent || navigator.platform || "");

// `useSyncExternalStore` reads the platform on the client only (server snapshot
// is `false`), avoiding both a hydration mismatch and a setState-in-effect.
function useIsMac(): boolean {
  return useSyncExternalStore(subscribeNoop, getIsMacSnapshot, () => false);
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs sm:text-sm">
      <span className="text-accent-1">visitor@nigel-smith.dev</span>
      <span className="text-muted">:</span>
      <span className="text-accent-4">~/contact</span>
      <span className="text-muted">$ </span>
      <span className="text-fg">{children}</span>
    </p>
  );
}

function EchoRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <p className="flex gap-3 text-xs sm:text-sm">
      <span className="w-24 shrink-0 text-accent-2">{label}</span>
      <span className={muted ? "text-muted" : "text-fg"}>{value}</span>
    </p>
  );
}

interface TerminalInputProps {
  id: string;
  label: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
  inputMode?: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  invalid?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

function TerminalInput({
  id,
  label,
  optional,
  value,
  onChange,
  onKeyDown,
  type = "text",
  inputMode = "text",
  autoComplete,
  placeholder,
  disabled,
  maxLength,
  invalid,
  inputRef,
}: TerminalInputProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
        {label}
        {optional ? <span className="text-[10px] normal-case text-muted/70">{"// optional"}</span> : null}
      </span>
      <div
        className={`flex items-center gap-2 rounded-lg border bg-bg/60 px-3 py-2 transition-colors duration-200 ${
          disabled
            ? "cursor-not-allowed border-border/60 opacity-50"
            : invalid
              ? "border-red-500/60 focus-within:border-red-500"
              : "border-border focus-within:border-accent-1/70"
        }`}
      >
        <span aria-hidden className={disabled ? "text-muted" : "text-accent-1"}>
          &gt;
        </span>
        <input
          ref={inputRef}
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={invalid || undefined}
          className="w-full bg-transparent font-mono text-sm text-fg outline-none placeholder:text-muted/50 disabled:cursor-not-allowed"
        />
      </div>
    </label>
  );
}

function NextButton({
  onClick,
  disabled,
  label = "next",
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group mt-1 inline-flex items-center gap-2 rounded-lg border border-accent-1/40 bg-accent-1/10 px-4 py-2 text-sm font-medium text-accent-1 transition-colors duration-200 hover:enabled:border-accent-1 hover:enabled:bg-accent-1/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="font-mono">{label}</span>
      <span aria-hidden className="transition-transform duration-200 group-hover:enabled:translate-x-0.5">
        →
      </span>
    </button>
  );
}

function IdentityStep({ api }: { api: ContactFormApi }) {
  const active = api.step === "identity";
  const isDone = done(api.step, "identity");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => nameRef.current?.focus(), 650);
    return () => window.clearTimeout(id);
  }, [active]);

  if (isDone) {
    return (
      <motion.div variants={block} initial="hidden" animate="show" className="space-y-1.5">
        <Prompt>whoami</Prompt>
        <EchoRow label="name" value={api.values.name} />
        <EchoRow
          label="company"
          value={api.values.company || "— none —"}
          muted={!api.values.company}
        />
      </motion.div>
    );
  }

  return (
    <motion.div variants={block} initial="hidden" animate="show" className="space-y-4">
      <Prompt>whoami</Prompt>
      <motion.div variants={fieldGroup} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={item}>
          <TerminalInput
            id="contact-name"
            label="name"
            value={api.values.name}
            onChange={api.setName}
            autoComplete="name"
            placeholder="Ada Lovelace"
            maxLength={MAX_LENGTHS.name}
            inputRef={nameRef}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                api.advance();
              }
            }}
          />
        </motion.div>
        <motion.div variants={item}>
          <TerminalInput
            id="contact-company"
            label="company"
            optional
            value={api.values.company}
            onChange={api.setCompany}
            autoComplete="organization"
            placeholder="Acme Inc."
            maxLength={MAX_LENGTHS.company}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                api.advance();
              }
            }}
          />
        </motion.div>
        <motion.div variants={item}>
          <NextButton onClick={api.advance} disabled={!api.identityValid} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MethodButton({
  method,
  selected,
  onSelect,
}: {
  method: ContactMethod;
  selected: boolean;
  onSelect: (method: ContactMethod) => void;
}) {
  const meta = METHOD_META[method];
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(method)}
      aria-pressed={selected}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200 ${
        selected
          ? "border-accent-1 bg-accent-1/15 text-accent-1"
          : "border-border bg-bg/40 text-muted hover:border-accent-1/50 hover:text-fg"
      }`}
    >
      <span aria-hidden>{selected ? "[x]" : "[ ]"}</span>
      {meta.label}
    </motion.button>
  );
}

function MethodStep({ api }: { api: ContactFormApi }) {
  const active = api.step === "method";
  const isDone = done(api.step, "method");
  const reachedStep = reached(api.step, "method");
  const entryRef = useRef<HTMLInputElement>(null);
  const method = api.values.method;

  useEffect(() => {
    if (active && method) {
      const id = window.setTimeout(() => entryRef.current?.focus(), 120);
      return () => window.clearTimeout(id);
    }
  }, [active, method]);

  if (!reachedStep) return null;

  if (isDone && method) {
    const meta = METHOD_META[method];
    return (
      <motion.div variants={block} initial="hidden" animate="show" className="space-y-1.5">
        <Prompt>select --channel</Prompt>
        <EchoRow label="channel" value={meta.label} />
        <EchoRow label={meta.label.toLowerCase()} value={api.values.contactValue} />
      </motion.div>
    );
  }

  const meta = method ? METHOD_META[method] : null;
  const showInvalid =
    method !== null &&
    api.values.contactValue.trim().length > 0 &&
    !isValidContactValue(method, api.values.contactValue);

  return (
    <motion.div variants={block} initial="hidden" animate="show" className="space-y-4">
      <Prompt>select --channel</Prompt>
      <p className="text-xs text-muted">How should I reach back out to you?</p>
      <div className="flex gap-3">
        <MethodButton method="phone" selected={method === "phone"} onSelect={api.selectMethod} />
        <MethodButton method="email" selected={method === "email"} onSelect={api.selectMethod} />
      </div>

      <TerminalInput
        id="contact-value"
        label={meta ? meta.label : "contact"}
        value={api.values.contactValue}
        onChange={api.setContactValue}
        disabled={method === null}
        type={meta ? meta.inputType : "text"}
        inputMode={meta ? meta.inputMode : "text"}
        autoComplete={meta ? meta.autoComplete : undefined}
        placeholder={meta ? meta.placeholder : "select a channel above first…"}
        maxLength={MAX_LENGTHS.contactValue}
        invalid={showInvalid}
        inputRef={entryRef}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            api.advance();
          }
        }}
      />

      <AnimatePresence>
        {showInvalid ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400"
          >
            {method === "email"
              ? "That doesn't look like a valid email address."
              : "That doesn't look like a valid phone number."}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <NextButton onClick={api.advance} disabled={!api.methodValid} />
    </motion.div>
  );
}

function MessageStep({ api }: { api: ContactFormApi }) {
  const active = api.step === "message";
  const reachedStep = reached(api.step, "message");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMac = useIsMac();
  const sending = api.status === "sending";

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 120);
    return () => window.clearTimeout(id);
  }, [active]);

  if (!reachedStep || api.step === "result") return null;

  const remaining = MAX_LENGTHS.message - api.values.message.length;

  return (
    <motion.div variants={block} initial="hidden" animate="show" className="space-y-3">
      <Prompt>compose --message</Prompt>
      <div className="overflow-hidden rounded-lg border border-border bg-bg/60 focus-within:border-accent-1/70">
        <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
          <span className="font-mono text-[11px] text-muted">message.txt</span>
          <span className={`font-mono text-[11px] ${remaining < 0 ? "text-red-400" : "text-muted/70"}`}>
            {api.values.message.length}/{MAX_LENGTHS.message}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={api.values.message}
          maxLength={MAX_LENGTHS.message}
          rows={5}
          disabled={sending}
          onChange={(e) => api.setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (isSendShortcut(e)) {
              e.preventDefault();
              if (api.messageValid && !sending) void api.submit();
            }
          }}
          placeholder="Type your message, then send…"
          className="block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-sm text-fg outline-none placeholder:text-muted/50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-muted">
          Press{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-fg">
            {isMac ? SEND_HINT_MAC : SEND_HINT}
          </kbd>{" "}
          to send
        </p>
        <button
          type="button"
          onClick={() => void api.submit()}
          disabled={!api.messageValid || sending}
          className="inline-flex items-center gap-2 rounded-lg border border-accent-1/40 bg-accent-1/10 px-4 py-2 text-sm font-medium text-accent-1 transition-colors duration-200 hover:enabled:border-accent-1 hover:enabled:bg-accent-1/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <>
              <span className="terminal-cursor font-mono">▋</span>
              transmitting…
            </>
          ) : (
            <>
              <span aria-hidden>↥</span>
              send message
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function ResultStep({ api }: { api: ContactFormApi }) {
  if (api.step !== "result") return null;
  const success = api.status === "success";
  const methodLabel = api.values.method ? METHOD_META[api.values.method].label.toLowerCase() : "your channel";

  return (
    <motion.div
      key={success ? "success" : "error"}
      variants={block}
      initial="hidden"
      animate="show"
      className="space-y-3"
      aria-live="polite"
    >
      <Prompt>transmit</Prompt>
      {success ? (
        <div className="space-y-3 rounded-lg border border-accent-1/40 bg-accent-1/5 p-5">
          <p className="text-base font-semibold text-accent-1">✓ Message transmitted</p>
          <p className="text-sm leading-relaxed text-fg">
            Thanks, {api.values.name.split(" ")[0] || api.values.name}. Your message landed in my
            inbox — I&apos;ll reply via {methodLabel} as soon as I can.
          </p>
          <p className="font-mono text-xs text-muted">process exited with code 0</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-fg transition-colors duration-200 hover:border-accent-1/60 hover:text-accent-1"
          >
            <span aria-hidden>←</span> back to home
          </Link>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-red-500/40 bg-red-500/5 p-5">
          <p className="text-base font-semibold text-red-400">✗ Transmission failed</p>
          <p className="text-sm leading-relaxed text-fg">
            {api.errorMessage ?? "Something went wrong on the server."}
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Sorry! Please try again, or reach me through another contact method:
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={api.retry}
              className="inline-flex items-center gap-2 rounded-lg border border-accent-1/40 bg-accent-1/10 px-4 py-2 text-sm font-medium text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/20"
            >
              <span aria-hidden>↻</span> retry
            </button>
            <Link
              href="mailto:nigel.nds.smith@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-fg transition-colors duration-200 hover:border-accent-1/60 hover:text-accent-1"
            >
              email me directly
            </Link>
            <Link
              href="https://www.linkedin.com/in/nigeld-smith/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-fg transition-colors duration-200 hover:border-accent-1/60 hover:text-accent-1"
            >
              linkedin
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function stepBadge(step: ContactStep, status: ContactFormApi["status"]): string {
  switch (step) {
    case "identity":
      return "01 / identity";
    case "method":
      return "02 / channel";
    case "message":
      return "03 / message";
    case "result":
      return status === "success" ? "transmitted" : "error";
  }
}

export function ContactTerminal() {
  const api = useContactForm();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Keep the newest prompt in view as the conversation grows.
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [api.step]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-bg/40 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-accent-2/80" />
          <span className="h-3 w-3 rounded-full bg-accent-1/80" />
        </span>
        <span className="ml-2 truncate font-mono text-xs text-muted">
          visitor@nigel-smith.dev: ~/contact
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted">
          {stepBadge(api.step, api.status)}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="terminal-scroll max-h-[72vh] overflow-y-auto p-5 font-mono text-sm sm:p-6"
      >
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <p className="text-xs text-muted sm:text-sm">
            <span className="text-accent-1">$</span> ./contact --init
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Contact <span className="text-accent-1">Nigel</span>
            <span className="terminal-cursor ml-1 inline-block h-7 w-2.5 translate-y-0.5 bg-accent-1 sm:h-8" aria-hidden />
          </h1>
          <p className="mt-2 text-xs text-muted sm:text-sm">
            Establishing a direct line. Answer each prompt to transmit a message.
          </p>
        </motion.div>

        <div className="mt-6 space-y-6">
          <IdentityStep api={api} />
          <MethodStep api={api} />
          <MessageStep api={api} />
          <ResultStep api={api} />
        </div>
      </div>
    </div>
  );
}
