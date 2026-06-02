import { METHOD_META } from "@/features/contact/contact.constants";
import { parseContactRequest } from "@/features/contact/contact.validation";
import type { ContactFormValues, ContactResponseBody } from "@/features/contact/contact.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
};

const NO_COMPANY = "*none specfied*";

function reply(body: ContactResponseBody, status = 200): Response {
  return Response.json(body, { status, headers: JSON_HEADERS });
}

/**
 * Cloudflare Turnstile verification stub.
 *
 * Until `TURNSTILE_SECRET_KEY` is configured the feature is considered
 * disabled and every request passes. When the key is added later, the client
 * only needs to start sending a real `turnstileToken` — no other change here
 * or in the request contract is required.
 */
async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function buildDiscordPayload(values: ContactFormValues) {
  return {
    username: "Contact Form Bot",
    // No mentions should ever ping a role/user from form input.
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        author: {
          name: "Website: Nigel's Portfolio",
          url: "https://nigel-smith.dev/",
          icon_url: "https://nigel-smith.dev/favicon/favicon-full.png",
        },
        title: "New Message...",
        description: "You got a new message!",
        footer: { text: "Generated form nigel-smith.dev/contact" },
        timestamp: new Date().toISOString(),
        fields: [
          { name: "Contact Name", value: values.name, inline: true },
          { name: "Company", value: values.company || NO_COMPANY, inline: true },
          { name: METHOD_META[values.method].label, value: values.contactValue, inline: true },
          { name: "Message", value: values.message, inline: false },
        ],
      },
    ],
  };
}

export async function POST(req: Request): Promise<Response> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return reply({ ok: false, error: "Malformed request body." }, 400);
  }

  const parsed = parseContactRequest(data);
  if (!parsed.ok) {
    return reply({ ok: false, error: parsed.error }, 400);
  }

  const turnstileToken =
    typeof (data as Record<string, unknown>).turnstileToken === "string"
      ? ((data as Record<string, unknown>).turnstileToken as string)
      : null;

  if (!(await verifyTurnstile(turnstileToken))) {
    return reply({ ok: false, error: "Verification failed. Please try again." }, 403);
  }

  const webhook = process.env.DISCORD_WEBHOOK;
  if (!webhook) {
    return reply({ ok: false, error: "The contact channel is not configured." }, 500);
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildDiscordPayload(parsed.values)),
    });
    if (!res.ok) {
      return reply({ ok: false, error: "The message could not be delivered." }, 502);
    }
  } catch {
    return reply({ ok: false, error: "The message could not be delivered." }, 502);
  }

  return reply({ ok: true });
}
