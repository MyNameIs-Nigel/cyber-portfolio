import type { ContactMethod } from "./contact.types";

/** Ordered terminal steps. Index order drives "what has been answered" logic. */
export const STEP_ORDER = ["identity", "method", "message", "result"] as const;
export type ContactStep = (typeof STEP_ORDER)[number];

export const CONTACT_ENDPOINT = "/api/contact";

/**
 * Field caps. `message` is capped at 1024 because that is the hard limit for a
 * single Discord embed field value — keeping the client in sync avoids a
 * silently truncated message on the server.
 */
export const MAX_LENGTHS = {
  name: 80,
  company: 80,
  contactValue: 120,
  message: 1024,
} as const;

/** Permissive email shape; the server re-validates with the same pattern. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits with common separators (spaces, dashes, dots, parens, leading +). */
export const PHONE_REGEX = /^\+?[0-9][0-9().\-\s]{6,19}$/;

export const METHOD_META: Record<
  ContactMethod,
  {
    /** Label shown on the selector button + as the Discord field name. */
    label: string;
    placeholder: string;
    inputType: "email" | "tel";
    inputMode: "email" | "tel";
    autoComplete: string;
  }
> = {
  email: {
    label: "Email",
    placeholder: "you@example.com",
    inputType: "email",
    inputMode: "email",
    autoComplete: "email",
  },
  phone: {
    label: "Phone",
    placeholder: "+1 (555) 123-4567",
    inputType: "tel",
    inputMode: "tel",
    autoComplete: "tel",
  },
};

/**
 * Send shortcut. Ctrl+Enter (Cmd+Enter on macOS) is the de-facto "send"
 * combo (Discord, Gmail, Slack, GitHub) and is not reserved by Chrome,
 * Firefox, Safari, or Edge, so it is safe to intercept.
 */
export const SEND_HINT = "Ctrl + Enter";
export const SEND_HINT_MAC = "⌘ + Enter";

export function isSendShortcut(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
}): boolean {
  return event.key === "Enter" && (event.ctrlKey || event.metaKey);
}
