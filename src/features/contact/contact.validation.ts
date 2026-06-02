import { EMAIL_REGEX, MAX_LENGTHS, PHONE_REGEX } from "./contact.constants";
import type { ContactFormValues, ContactMethod } from "./contact.types";

export function isContactMethod(value: unknown): value is ContactMethod {
  return value === "email" || value === "phone";
}

/** Validates the entry against the rules for the chosen method. */
export function isValidContactValue(method: ContactMethod, value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LENGTHS.contactValue) return false;
  return method === "email" ? EMAIL_REGEX.test(trimmed) : PHONE_REGEX.test(trimmed);
}

export type ParsedContactRequest =
  | { ok: true; values: ContactFormValues }
  | { ok: false; error: string };

/**
 * Server-side gatekeeper: turns untrusted JSON into a trimmed, length-capped,
 * fully-validated {@link ContactFormValues}. The client runs the same checks
 * for UX, but this is the authoritative validation.
 */
export function parseContactRequest(data: unknown): ParsedContactRequest {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Malformed request body." };
  }
  const body = data as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_LENGTHS.name) {
    return { ok: false, error: "A valid name is required." };
  }

  const company =
    typeof body.company === "string" ? body.company.trim().slice(0, MAX_LENGTHS.company) : "";

  if (!isContactMethod(body.method)) {
    return { ok: false, error: "A valid contact method is required." };
  }
  const method = body.method;

  const contactValue = typeof body.contactValue === "string" ? body.contactValue.trim() : "";
  if (!isValidContactValue(method, contactValue)) {
    return { ok: false, error: `Please provide a valid ${method}.` };
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return { ok: false, error: "A message is required." };
  }

  return {
    ok: true,
    values: {
      name,
      company,
      method,
      contactValue,
      message: message.slice(0, MAX_LENGTHS.message),
    },
  };
}
