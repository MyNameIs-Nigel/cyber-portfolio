"use client";

import { useCallback, useMemo, useState } from "react";
import { CONTACT_ENDPOINT, STEP_ORDER, type ContactStep } from "./contact.constants";
import { isValidContactValue } from "./contact.validation";
import type {
  ContactMethod,
  ContactRequestBody,
  ContactResponseBody,
  SubmitStatus,
} from "./contact.types";

interface FormState {
  name: string;
  company: string;
  method: ContactMethod | null;
  contactValue: string;
  message: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  company: "",
  method: null,
  contactValue: "",
  message: "",
};

export function useContactForm() {
  const [step, setStep] = useState<ContactStep>("identity");
  const [values, setValues] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  const setName = useCallback((name: string) => setValues((v) => ({ ...v, name })), []);
  const setCompany = useCallback((company: string) => setValues((v) => ({ ...v, company })), []);
  const setContactValue = useCallback(
    (contactValue: string) => setValues((v) => ({ ...v, contactValue })),
    [],
  );
  const setMessage = useCallback((message: string) => setValues((v) => ({ ...v, message })), []);

  // Switching method wipes the entry so a phone number can never linger in an
  // email field (or vice-versa) and the input type always matches the choice.
  const selectMethod = useCallback((method: ContactMethod) => {
    setValues((v) => (v.method === method ? v : { ...v, method, contactValue: "" }));
  }, []);

  const identityValid = values.name.trim().length > 0;
  const methodValid =
    values.method !== null && isValidContactValue(values.method, values.contactValue);
  const messageValid = values.message.trim().length > 0;

  const advance = useCallback(() => {
    setStep((current) => {
      if (current === "identity") return identityValid ? "method" : current;
      if (current === "method") return methodValid ? "message" : current;
      return current;
    });
  }, [identityValid, methodValid]);

  const submit = useCallback(async () => {
    if (status === "sending") return;
    if (values.method === null || !identityValid || !methodValid || !messageValid) return;

    setStatus("sending");
    setErrorMessage(null);

    const body: ContactRequestBody = {
      name: values.name.trim(),
      company: values.company.trim(),
      method: values.method,
      contactValue: values.contactValue.trim(),
      message: values.message.trim(),
      // Reserved for a future Cloudflare Turnstile token; null while disabled.
      turnstileToken: null,
    };

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as ContactResponseBody | null;
      if (!res.ok || !data?.ok) {
        setErrorMessage(data?.error ?? "The message could not be delivered.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMessage("Could not reach the server. Check your connection and try again.");
      setStatus("error");
    } finally {
      setStep("result");
    }
  }, [status, values, identityValid, methodValid, messageValid]);

  const retry = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
    setStep("message");
  }, []);

  return useMemo(
    () => ({
      step,
      stepIndex,
      status,
      errorMessage,
      values,
      identityValid,
      methodValid,
      messageValid,
      setName,
      setCompany,
      setContactValue,
      setMessage,
      selectMethod,
      advance,
      submit,
      retry,
    }),
    [
      step,
      stepIndex,
      status,
      errorMessage,
      values,
      identityValid,
      methodValid,
      messageValid,
      setName,
      setCompany,
      setContactValue,
      setMessage,
      selectMethod,
      advance,
      submit,
      retry,
    ],
  );
}

export type ContactFormApi = ReturnType<typeof useContactForm>;
